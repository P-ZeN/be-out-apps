--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: format_address(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.format_address(p_address_id uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT CONCAT_WS(', ', 
        a.address_line_1,
        NULLIF(a.address_line_2, ''),
        NULLIF(a.address_line_3, ''),
        a.locality,
        NULLIF(a.administrative_area, ''),
        NULLIF(a.postal_code, ''),
        a.country_code
    )
    INTO result
    FROM addresses a
    WHERE a.id = p_address_id;
    
    RETURN result;
END;
$$;


--
-- Name: generate_booking_reference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_booking_reference() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 'BO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 6, '0');
END;
$$;


--
-- Name: get_daily_revenue(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_daily_revenue(start_date date, end_date date) RETURNS TABLE(date date, total_revenue numeric, transaction_count integer, avg_transaction numeric)
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    RETURN QUERY
                    SELECT
                        pt.created_at::DATE as date,
                        SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END) as total_revenue,
                        COUNT(*)
                    ::INTEGER as transaction_count,
        AVG
                    (CASE WHEN pt.status = 'succeeded' THEN pt.amount
                END
                ) as avg_transaction
    FROM payment_transactions pt
    WHERE pt.created_at::DATE BETWEEN start_date AND end_date
    GROUP BY pt.created_at::DATE
    ORDER BY date DESC;
                END;
$$;


--
-- Name: get_entity_addresses(character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_entity_addresses(p_entity_type character varying, p_entity_id uuid) RETURNS TABLE(id uuid, address_line_1 character varying, address_line_2 character varying, address_line_3 character varying, locality character varying, administrative_area character varying, postal_code character varying, country_code character, latitude numeric, longitude numeric, address_type character varying, label character varying, is_primary boolean, is_verified boolean, formatted_address text, relationship_type character varying, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.address_line_1,
        a.address_line_2,
        a.address_line_3,
        a.locality,
        a.administrative_area,
        a.postal_code,
        a.country_code,
        a.latitude,
        a.longitude,
        a.address_type,
        a.label,
        a.is_primary,
        a.is_verified,
        COALESCE(a.formatted_address, format_address(a.id)) as formatted_address,
        ar.relationship_type,
        a.created_at
    FROM addresses a
    JOIN address_relationships ar ON a.id = ar.address_id
    WHERE ar.entity_type = p_entity_type 
    AND ar.entity_id = p_entity_id
    AND ar.is_active = true
    ORDER BY a.is_primary DESC, a.created_at ASC;
END;
$$;


--
-- Name: get_organizer_recent_bookings(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_organizer_recent_bookings(organizer_id uuid, period_days integer DEFAULT 30, limit_count integer DEFAULT 10) RETURNS TABLE(id uuid, event_title character varying, event_date timestamp with time zone, customer_email character varying, quantity integer, total_price numeric, booking_status character varying, booking_date timestamp with time zone, payment_status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        e.title as event_title,
        e.event_date,     -- Now correctly TIMESTAMP WITH TIME ZONE
        u.email as customer_email,
        b.quantity,
        b.total_price,
        b.booking_status,
        b.booking_date,   -- Now correctly TIMESTAMP WITH TIME ZONE
        COALESCE(b.payment_status, 'pending')::VARCHAR as payment_status
    FROM bookings b
    JOIN events e ON b.event_id = e.id
    JOIN users u ON b.user_id = u.id
    WHERE e.organizer_id = get_organizer_recent_bookings.organizer_id
    AND b.booking_date >= CURRENT_DATE - INTERVAL '1 day' * period_days
    ORDER BY b.booking_date DESC
    LIMIT limit_count;
END;
$$;


--
-- Name: get_organizer_stats(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_organizer_stats(organizer_id uuid, period_days integer DEFAULT 30) RETURNS TABLE(total_events bigint, total_bookings bigint, total_revenue numeric, total_tickets_sold bigint, pending_payouts numeric, avg_rating numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total events by organizer
        (SELECT COUNT(*)::BIGINT 
         FROM events e 
         WHERE e.organizer_id = get_organizer_stats.organizer_id
         AND e.created_at >= CURRENT_DATE - INTERVAL '1 day' * period_days) as total_events,
        
        -- Total bookings for organizer's events
        (SELECT COUNT(*)::BIGINT
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE e.organizer_id = get_organizer_stats.organizer_id
         AND b.booking_date >= CURRENT_DATE - INTERVAL '1 day' * period_days
         AND b.booking_status = 'confirmed') as total_bookings,
        
        -- Total revenue from confirmed bookings
        (SELECT COALESCE(SUM(b.total_price), 0)::NUMERIC
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE e.organizer_id = get_organizer_stats.organizer_id
         AND b.booking_date >= CURRENT_DATE - INTERVAL '1 day' * period_days
         AND b.booking_status = 'confirmed') as total_revenue,
        
        -- Total tickets sold
        (SELECT COALESCE(SUM(b.quantity), 0)::BIGINT
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE e.organizer_id = get_organizer_stats.organizer_id
         AND b.booking_date >= CURRENT_DATE - INTERVAL '1 day' * period_days
         AND b.booking_status = 'confirmed') as total_tickets_sold,
        
        -- Pending payouts (simplified - would be more complex in real app)
        (SELECT COALESCE(SUM(b.total_price * 0.95), 0)::NUMERIC
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE e.organizer_id = get_organizer_stats.organizer_id
         AND b.booking_status = 'confirmed'
         AND b.booking_date >= CURRENT_DATE - INTERVAL '7 days') as pending_payouts,
        
        -- Average rating (placeholder - would need reviews table)
        4.3::NUMERIC as avg_rating;
END;
$$;


--
-- Name: get_organizer_upcoming_events(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_organizer_upcoming_events(organizer_id uuid, limit_count integer DEFAULT 10) RETURNS TABLE(id uuid, title character varying, description text, event_date timestamp with time zone, venue_name character varying, total_bookings bigint, revenue numeric, tickets_sold bigint, status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,  -- This is now correctly TIMESTAMP WITH TIME ZONE
        v.name as venue_name,
        COUNT(DISTINCT b.id)::BIGINT as total_bookings,
        COALESCE(SUM(b.total_price), 0)::NUMERIC as revenue,
        COALESCE(SUM(b.quantity), 0)::BIGINT as tickets_sold,
        e.status::VARCHAR as status
    FROM events e
    LEFT JOIN venues v ON e.venue_id = v.id
    LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
    WHERE e.organizer_id = get_organizer_upcoming_events.organizer_id
    AND e.event_date >= CURRENT_TIMESTAMP
    GROUP BY e.id, e.title, e.description, e.event_date, v.name, e.status
    ORDER BY e.event_date ASC
    LIMIT limit_count;
END;
$$;


--
-- Name: get_primary_address(character varying, uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_primary_address(p_entity_type character varying, p_entity_id uuid, p_relationship_type character varying DEFAULT 'primary'::character varying) RETURNS TABLE(id uuid, formatted_address text, latitude numeric, longitude numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        COALESCE(a.formatted_address, format_address(a.id)) as formatted_address,
        a.latitude,
        a.longitude
    FROM addresses a
    JOIN address_relationships ar ON a.id = ar.address_id
    WHERE ar.entity_type = p_entity_type 
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type
    AND ar.is_active = true
    ORDER BY a.is_primary DESC, a.created_at ASC
    LIMIT 1;
END;
$$;


--
-- Name: log_admin_action(uuid, character varying, character varying, uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_admin_action(p_admin_user_id uuid, p_action_type character varying, p_target_type character varying, p_target_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO admin_actions (
        admin_user_id, action_type, target_type, target_id, description, metadata
    ) VALUES (
        p_admin_user_id, p_action_type, p_target_type, p_target_id, p_description, p_metadata
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$;


--
-- Name: log_favorite_action(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_favorite_action(p_user_id uuid, p_event_id uuid, p_action character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
        INSERT INTO admin_actions (
            admin_user_id, 
            action_type, 
            target_type, 
            target_id, 
            description,
            metadata
        ) VALUES (
            p_user_id,
            'user_favorite',
            'event',
            p_event_id,
            CASE 
                WHEN p_action = 'add' THEN 'User added event to favorites'
                WHEN p_action = 'remove' THEN 'User removed event from favorites'
                ELSE 'User favorite action'
            END,
            json_build_object(
                'action', p_action,
                'user_id', p_user_id,
                'event_id', p_event_id,
                'timestamp', NOW()
            )::TEXT
        );
    END IF;
END;
$$;


--
-- Name: set_booking_reference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_booking_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: set_primary_address(character varying, uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_primary_address(p_entity_type character varying, p_entity_id uuid, p_address_id uuid, p_relationship_type character varying DEFAULT 'primary'::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- First, unset all primary flags for this entity/relationship type
    UPDATE addresses 
    SET is_primary = FALSE
    FROM address_relationships ar
    WHERE addresses.id = ar.address_id
    AND ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type;
    
    -- Then set the new primary
    UPDATE addresses 
    SET is_primary = TRUE
    FROM address_relationships ar
    WHERE addresses.id = ar.address_id
    AND addresses.id = p_address_id
    AND ar.entity_type = p_entity_type
    AND ar.entity_id = p_entity_id
    AND ar.relationship_type = p_relationship_type;
    
    RETURN FOUND;
END;
$$;


--
-- Name: update_address_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_address_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_booking_payment_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_booking_payment_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    -- Update booking payment status when payment transaction status changes
                    IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
                    UPDATE bookings
        SET payment_status = 'paid',
            booking_status = CASE
                WHEN booking_status = 'pending' THEN 'confirmed'
                ELSE booking_status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.booking_id;
                    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
                    UPDATE bookings
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.booking_id;
                END
                IF;

    RETURN NEW;
                END;
$$;


--
-- Name: update_event_favorites_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_event_favorites_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events 
        SET favorites_count = favorites_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET favorites_count = favorites_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_event_tickets(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_event_tickets() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- When booking is confirmed, reduce available tickets
    IF NEW.booking_status = 'confirmed' AND (OLD IS NULL OR OLD.booking_status != 'confirmed') THEN
        UPDATE events 
        SET available_tickets = available_tickets - NEW.quantity
        WHERE id = NEW.event_id AND available_tickets >= NEW.quantity;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Not enough tickets available for event %', NEW.event_id;
        END IF;
    END IF;
    
    -- When booking is cancelled, restore available tickets
    IF NEW.booking_status IN ('cancelled', 'refunded') AND OLD.booking_status = 'confirmed' THEN
        UPDATE events 
        SET available_tickets = available_tickets + NEW.quantity
        WHERE id = NEW.event_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_organizer_analytics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_organizer_analytics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update daily analytics
    INSERT INTO organizer_analytics (
        organizer_id, 
        period_type, 
        period_start, 
        period_end,
        total_bookings,
        total_revenue,
        total_tickets_sold
    )
    SELECT 
        e.organizer_id,
        'daily',
        CURRENT_DATE,
        CURRENT_DATE,
        1,
        NEW.total_price,
        NEW.quantity
    FROM events e
    WHERE e.id = NEW.event_id
    ON CONFLICT (organizer_id, period_type, period_start)
    DO UPDATE SET
        total_bookings = organizer_analytics.total_bookings + 1,
        total_revenue = organizer_analytics.total_revenue + NEW.total_price,
        total_tickets_sold = organizer_analytics.total_tickets_sold + NEW.quantity;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: address_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.address_relationships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    address_id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    relationship_type character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_entity_type CHECK (((entity_type)::text = ANY ((ARRAY['user'::character varying, 'organizer'::character varying, 'venue'::character varying, 'event'::character varying])::text[]))),
    CONSTRAINT valid_relationship_type CHECK (((relationship_type)::text = ANY ((ARRAY['primary'::character varying, 'billing'::character varying, 'shipping'::character varying, 'business'::character varying, 'venue_location'::character varying, 'event_location'::character varying])::text[])))
);


--
-- Name: TABLE address_relationships; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.address_relationships IS 'Links addresses to various entities (users, organizers, venues, events)';


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    address_line_1 character varying(255) NOT NULL,
    address_line_2 character varying(255),
    address_line_3 character varying(255),
    locality character varying(100) NOT NULL,
    administrative_area character varying(100),
    postal_code character varying(20),
    country_code character(2) DEFAULT 'FR'::bpchar NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    address_type character varying(50) NOT NULL,
    label character varying(100),
    is_primary boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    formatted_address text,
    place_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_address_type CHECK (((address_type)::text = ANY ((ARRAY['home'::character varying, 'business'::character varying, 'billing'::character varying, 'shipping'::character varying, 'venue'::character varying, 'event'::character varying])::text[]))),
    CONSTRAINT valid_country_code CHECK ((country_code ~ '^[A-Z]{2}$'::text))
);


--
-- Name: TABLE addresses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.addresses IS 'Centralized address storage following international standards';


--
-- Name: COLUMN addresses.address_line_1; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.address_line_1 IS 'Primary address line - street number and name';


--
-- Name: COLUMN addresses.address_line_2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.address_line_2 IS 'Secondary address line - apartment, suite, unit, etc.';


--
-- Name: COLUMN addresses.locality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.locality IS 'City, town, or village name';


--
-- Name: COLUMN addresses.administrative_area; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.administrative_area IS 'State, province, or region';


--
-- Name: COLUMN addresses.country_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., FR, US, DE)';


--
-- Name: COLUMN addresses.address_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.address_type IS 'Category of address: home, business, billing, shipping, venue, event';


--
-- Name: COLUMN addresses.label; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.label IS 'User-friendly label for the address';


--
-- Name: COLUMN addresses.is_primary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.is_primary IS 'Whether this is the primary address for its type';


--
-- Name: COLUMN addresses.is_verified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.is_verified IS 'Whether the address has been verified through postal service or geocoding';


--
-- Name: COLUMN addresses.formatted_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.formatted_address IS 'Pre-formatted address string for display purposes';


--
-- Name: COLUMN addresses.place_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.addresses.place_id IS 'External service place ID (Google Places, etc.) for validation and autocomplete';


--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_user_id uuid,
    action_type character varying(100) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid,
    description text,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_actions_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_actions_backup (
    id uuid,
    admin_user_id uuid,
    action_type character varying(100),
    target_type character varying(50),
    target_id uuid,
    description text,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone
);


--
-- Name: booking_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid,
    ticket_number character varying(100) NOT NULL,
    ticket_status character varying(50) DEFAULT 'valid'::character varying,
    qr_code text,
    seat_number character varying(50),
    holder_name character varying(255),
    holder_email character varying(255),
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT booking_tickets_ticket_status_check CHECK (((ticket_status)::text = ANY ((ARRAY['valid'::character varying, 'used'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    event_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(10,2) NOT NULL,
    booking_status character varying(20) DEFAULT 'confirmed'::character varying,
    booking_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    unit_price numeric,
    payment_method character varying(50),
    transaction_id character varying(255),
    booking_reference character varying(50),
    customer_name character varying(255),
    customer_email character varying(255),
    customer_phone character varying(50),
    special_requests text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    stripe_payment_intent_id character varying(255),
    CONSTRAINT bookings_booking_status_check CHECK (((booking_status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT bookings_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    color character varying(7),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name_fr character varying(100),
    name_en character varying(100),
    name_es character varying(100),
    description_fr text,
    description_en text,
    description_es text
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient character varying(255) NOT NULL,
    template_name character varying(255),
    subject text,
    status character varying(50) NOT NULL,
    error_message text,
    message_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    opened_at timestamp without time zone,
    clicked_at timestamp without time zone
);


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    setting_key character varying(255) NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    description text,
    variables jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    language character varying(10) DEFAULT 'en'::character varying NOT NULL
);


--
-- Name: event_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_categories (
    event_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    short_description character varying(500),
    image_url character varying(500),
    venue_id uuid,
    organizer_id uuid,
    original_price numeric(10,2) NOT NULL,
    discounted_price numeric(10,2) NOT NULL,
    discount_percentage integer,
    total_tickets integer DEFAULT 0 NOT NULL,
    available_tickets integer DEFAULT 0 NOT NULL,
    event_date timestamp with time zone NOT NULL,
    booking_deadline timestamp with time zone,
    is_last_minute boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    admin_notes text,
    moderation_status character varying(50) DEFAULT 'approved'::character varying,
    approved_by uuid,
    approved_at timestamp with time zone,
    favorites_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT events_moderation_status_check CHECK (((moderation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'flagged'::character varying])::text[]))),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'sold_out'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: organizer_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizer_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    stripe_account_id character varying(255) NOT NULL,
    account_type character varying(50) DEFAULT 'express'::character varying,
    country character varying(2) DEFAULT 'FR'::character varying,
    business_type character varying(50),
    onboarding_completed boolean DEFAULT false,
    payouts_enabled boolean DEFAULT false,
    charges_enabled boolean DEFAULT false,
    details_submitted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: organizer_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizer_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_name character varying(255),
    business_registration_number character varying(100),
    vat_number character varying(50),
    contact_person character varying(255),
    phone character varying(20),
    website_url character varying(500),
    description text,
    business_address text,
    business_city character varying(100),
    business_postal_code character varying(20),
    business_country character varying(100) DEFAULT 'France'::character varying,
    logo_url character varying(500),
    commission_rate numeric(5,2) DEFAULT 5.00,
    status character varying(50) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT organizer_profiles_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'suspended'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    role character varying(50) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    provider character varying(50) DEFAULT 'email'::character varying NOT NULL,
    provider_id character varying(255),
    is_active boolean DEFAULT true,
    onboarding_complete boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'moderator'::character varying, 'organizer'::character varying])::text[])))
);


--
-- Name: organizer_addresses; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.organizer_addresses AS
 SELECT op.id AS organizer_id,
    op.company_name,
    u.email,
    a.id,
    a.address_line_1,
    a.address_line_2,
    a.address_line_3,
    a.locality,
    a.administrative_area,
    a.postal_code,
    a.country_code,
    a.latitude,
    a.longitude,
    a.address_type,
    a.label,
    a.is_primary,
    a.is_verified,
    a.formatted_address,
    a.place_id,
    a.created_at,
    a.updated_at,
    ar.relationship_type,
    ar.is_active
   FROM (((public.organizer_profiles op
     JOIN public.users u ON ((u.id = op.user_id)))
     JOIN public.address_relationships ar ON (((ar.entity_id = op.id) AND ((ar.entity_type)::text = 'organizer'::text))))
     JOIN public.addresses a ON ((a.id = ar.address_id)))
  WHERE (ar.is_active = true);


--
-- Name: organizer_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizer_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organizer_id uuid NOT NULL,
    period_type character varying(20) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_events integer DEFAULT 0,
    total_bookings integer DEFAULT 0,
    total_revenue numeric(10,2) DEFAULT 0,
    total_tickets_sold integer DEFAULT 0,
    avg_ticket_price numeric(10,2) DEFAULT 0,
    top_event_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT organizer_analytics_period_type_check CHECK (((period_type)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::text[])))
);


--
-- Name: organizer_dashboard_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.organizer_dashboard_view AS
 SELECT u.id AS organizer_id,
    u.email,
    op.company_name,
    op.status AS profile_status,
    oa.onboarding_completed,
    oa.payouts_enabled,
    count(DISTINCT e.id) AS total_events,
    count(DISTINCT b.id) AS total_bookings,
    COALESCE(sum(b.total_price), (0)::numeric) AS total_revenue,
    COALESCE(sum(b.quantity), (0)::bigint) AS total_tickets_sold,
    count(DISTINCT
        CASE
            WHEN (e.event_date > CURRENT_TIMESTAMP) THEN e.id
            ELSE NULL::uuid
        END) AS upcoming_events,
    count(DISTINCT
        CASE
            WHEN (b.booking_date >= (CURRENT_DATE - '30 days'::interval)) THEN b.id
            ELSE NULL::uuid
        END) AS recent_bookings
   FROM ((((public.users u
     JOIN public.organizer_profiles op ON ((u.id = op.user_id)))
     LEFT JOIN public.organizer_accounts oa ON ((u.id = oa.user_id)))
     LEFT JOIN public.events e ON ((u.id = e.organizer_id)))
     LEFT JOIN public.bookings b ON (((e.id = b.event_id) AND ((b.booking_status)::text = 'confirmed'::text))))
  WHERE ((u.role)::text = 'organizer'::text)
  GROUP BY u.id, u.email, op.company_name, op.status, oa.onboarding_completed, oa.payouts_enabled;


--
-- Name: organizer_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizer_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organizer_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    priority character varying(20) DEFAULT 'normal'::character varying,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT organizer_notifications_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT organizer_notifications_type_check CHECK (((type)::text = ANY ((ARRAY['booking'::character varying, 'payment'::character varying, 'dispute'::character varying, 'system'::character varying, 'marketing'::character varying])::text[])))
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    stripe_payment_intent_id character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying,
    status character varying(50) NOT NULL,
    payment_method_type character varying(50),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payment_analytics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.payment_analytics AS
 SELECT date_trunc('day'::text, pt.created_at) AS transaction_date,
    count(*) AS total_transactions,
    count(
        CASE
            WHEN ((pt.status)::text = 'succeeded'::text) THEN 1
            ELSE NULL::integer
        END) AS successful_transactions,
    count(
        CASE
            WHEN ((pt.status)::text = 'failed'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_transactions,
    sum(
        CASE
            WHEN ((pt.status)::text = 'succeeded'::text) THEN pt.amount
            ELSE (0)::numeric
        END) AS total_revenue,
    avg(
        CASE
            WHEN ((pt.status)::text = 'succeeded'::text) THEN pt.amount
            ELSE NULL::numeric
        END) AS avg_transaction_value,
    count(DISTINCT pt.booking_id) AS unique_bookings,
    count(DISTINCT b.customer_email) AS unique_customers
   FROM (public.payment_transactions pt
     LEFT JOIN public.bookings b ON ((pt.booking_id = b.id)))
  GROUP BY (date_trunc('day'::text, pt.created_at))
  ORDER BY (date_trunc('day'::text, pt.created_at)) DESC;


--
-- Name: payment_disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_disputes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    stripe_charge_id character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying,
    reason character varying(100),
    status character varying(50) NOT NULL,
    evidence_due_by timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payment_refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_refunds (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_transaction_id uuid,
    stripe_refund_id character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying,
    reason character varying(100),
    status character varying(50) NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: revenue_splits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revenue_splits (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    payment_transaction_id uuid,
    total_amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    platform_fee_percentage numeric(5,2) DEFAULT 5.00,
    organizer_amount numeric(10,2) NOT NULL,
    organizer_account_id uuid,
    transfer_status character varying(50) DEFAULT 'pending'::character varying,
    stripe_transfer_id character varying(255),
    transferred_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    event_id uuid,
    booking_id uuid,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: user_addresses; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_addresses AS
 SELECT u.id AS user_id,
    u.email,
    a.id,
    a.address_line_1,
    a.address_line_2,
    a.address_line_3,
    a.locality,
    a.administrative_area,
    a.postal_code,
    a.country_code,
    a.latitude,
    a.longitude,
    a.address_type,
    a.label,
    a.is_primary,
    a.is_verified,
    a.formatted_address,
    a.place_id,
    a.created_at,
    a.updated_at,
    ar.relationship_type,
    ar.is_active
   FROM ((public.users u
     JOIN public.address_relationships ar ON (((ar.entity_id = u.id) AND ((ar.entity_type)::text = 'user'::text))))
     JOIN public.addresses a ON ((a.id = ar.address_id)))
  WHERE (ar.is_active = true);


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    profile_picture text,
    phone character varying(20),
    date_of_birth date,
    street_number character varying(10),
    street_name character varying(255),
    postal_code character varying(20),
    city character varying(100),
    country character varying(100) DEFAULT 'France'::character varying
);


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    city character varying(100) NOT NULL,
    postal_code character varying(20),
    country character varying(100) DEFAULT 'France'::character varying,
    latitude numeric(10,8),
    longitude numeric(11,8),
    capacity integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: venue_addresses; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.venue_addresses AS
 SELECT v.id AS venue_id,
    v.name AS venue_name,
    a.id,
    a.address_line_1,
    a.address_line_2,
    a.address_line_3,
    a.locality,
    a.administrative_area,
    a.postal_code,
    a.country_code,
    a.latitude,
    a.longitude,
    a.address_type,
    a.label,
    a.is_primary,
    a.is_verified,
    a.formatted_address,
    a.place_id,
    a.created_at,
    a.updated_at,
    ar.relationship_type,
    ar.is_active
   FROM ((public.venues v
     JOIN public.address_relationships ar ON (((ar.entity_id = v.id) AND ((ar.entity_type)::text = 'venue'::text))))
     JOIN public.addresses a ON ((a.id = ar.address_id)))
  WHERE (ar.is_active = true);


--
-- Name: address_relationships address_relationships_entity_type_entity_id_relationship_ty_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.address_relationships
    ADD CONSTRAINT address_relationships_entity_type_entity_id_relationship_ty_key UNIQUE (entity_type, entity_id, relationship_type);


--
-- Name: address_relationships address_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.address_relationships
    ADD CONSTRAINT address_relationships_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: booking_tickets booking_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_tickets
    ADD CONSTRAINT booking_tickets_pkey PRIMARY KEY (id);


--
-- Name: booking_tickets booking_tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_tickets
    ADD CONSTRAINT booking_tickets_ticket_number_key UNIQUE (ticket_number);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_user_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_event_id_key UNIQUE (user_id, event_id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_pkey PRIMARY KEY (id);


--
-- Name: email_settings email_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: email_templates email_templates_name_language_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_name_language_key UNIQUE (name, language);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: event_categories event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_pkey PRIMARY KEY (event_id, category_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: organizer_accounts organizer_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_accounts
    ADD CONSTRAINT organizer_accounts_pkey PRIMARY KEY (id);


--
-- Name: organizer_accounts organizer_accounts_stripe_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_accounts
    ADD CONSTRAINT organizer_accounts_stripe_account_id_key UNIQUE (stripe_account_id);


--
-- Name: organizer_analytics organizer_analytics_organizer_id_period_type_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_analytics
    ADD CONSTRAINT organizer_analytics_organizer_id_period_type_period_start_key UNIQUE (organizer_id, period_type, period_start);


--
-- Name: organizer_analytics organizer_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_analytics
    ADD CONSTRAINT organizer_analytics_pkey PRIMARY KEY (id);


--
-- Name: organizer_notifications organizer_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_notifications
    ADD CONSTRAINT organizer_notifications_pkey PRIMARY KEY (id);


--
-- Name: organizer_profiles organizer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_profiles
    ADD CONSTRAINT organizer_profiles_pkey PRIMARY KEY (id);


--
-- Name: organizer_profiles organizer_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_profiles
    ADD CONSTRAINT organizer_profiles_user_id_key UNIQUE (user_id);


--
-- Name: payment_disputes payment_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_disputes
    ADD CONSTRAINT payment_disputes_pkey PRIMARY KEY (id);


--
-- Name: payment_refunds payment_refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_refunds
    ADD CONSTRAINT payment_refunds_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: revenue_splits revenue_splits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_splits
    ADD CONSTRAINT revenue_splits_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_user_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_event_id_key UNIQUE (user_id, event_id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_event_id_key UNIQUE (user_id, event_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_provider_key UNIQUE (email, provider);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: idx_address_relationships_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_address_relationships_address ON public.address_relationships USING btree (address_id);


--
-- Name: idx_address_relationships_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_address_relationships_entity ON public.address_relationships USING btree (entity_type, entity_id);


--
-- Name: idx_address_relationships_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_address_relationships_type ON public.address_relationships USING btree (relationship_type);


--
-- Name: idx_addresses_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_coordinates ON public.addresses USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: idx_addresses_country_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_country_code ON public.addresses USING btree (country_code);


--
-- Name: idx_addresses_locality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_locality ON public.addresses USING btree (locality);


--
-- Name: idx_addresses_postal_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_postal_code ON public.addresses USING btree (postal_code);


--
-- Name: idx_addresses_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addresses_type ON public.addresses USING btree (address_type);


--
-- Name: idx_admin_actions_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_action_type ON public.admin_actions USING btree (action_type);


--
-- Name: idx_admin_actions_admin_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin_user ON public.admin_actions USING btree (admin_user_id);


--
-- Name: idx_admin_actions_admin_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_admin_user_id ON public.admin_actions USING btree (admin_user_id);


--
-- Name: idx_admin_actions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_created ON public.admin_actions USING btree (created_at);


--
-- Name: idx_admin_actions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_created_at ON public.admin_actions USING btree (created_at DESC);


--
-- Name: idx_admin_actions_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_target ON public.admin_actions USING btree (target_type, target_id);


--
-- Name: idx_admin_actions_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_target_id ON public.admin_actions USING btree (target_id);


--
-- Name: idx_admin_actions_target_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_target_type ON public.admin_actions USING btree (target_type);


--
-- Name: idx_admin_actions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_actions_type ON public.admin_actions USING btree (action_type);


--
-- Name: idx_booking_tickets_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_tickets_booking_id ON public.booking_tickets USING btree (booking_id);


--
-- Name: idx_booking_tickets_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_tickets_number ON public.booking_tickets USING btree (ticket_number);


--
-- Name: idx_bookings_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_event ON public.bookings USING btree (event_id);


--
-- Name: idx_bookings_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_event_id ON public.bookings USING btree (event_id);


--
-- Name: idx_bookings_organizer_events; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_organizer_events ON public.bookings USING btree (event_id, booking_date DESC);


--
-- Name: idx_bookings_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_reference ON public.bookings USING btree (booking_reference);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (booking_status);


--
-- Name: idx_bookings_stripe_payment_intent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_stripe_payment_intent ON public.bookings USING btree (stripe_payment_intent_id);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: idx_categories_name_en; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_name_en ON public.categories USING btree (name_en);


--
-- Name: idx_categories_name_es; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_name_es ON public.categories USING btree (name_es);


--
-- Name: idx_categories_name_fr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_name_fr ON public.categories USING btree (name_fr);


--
-- Name: idx_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- Name: idx_email_logs_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_recipient ON public.email_logs USING btree (recipient);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_email_logs_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_template ON public.email_logs USING btree (template_name);


--
-- Name: idx_email_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_settings_key ON public.email_settings USING btree (setting_key);


--
-- Name: idx_email_templates_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_active ON public.email_templates USING btree (is_active);


--
-- Name: idx_email_templates_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_language ON public.email_templates USING btree (language);


--
-- Name: idx_email_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_name ON public.email_templates USING btree (name);


--
-- Name: idx_email_templates_name_language; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_name_language ON public.email_templates USING btree (name, language);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_date ON public.events USING btree (event_date);


--
-- Name: idx_events_favorites_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_favorites_count ON public.events USING btree (favorites_count DESC);


--
-- Name: idx_events_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_featured ON public.events USING btree (is_featured);


--
-- Name: idx_events_last_minute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_last_minute ON public.events USING btree (is_last_minute);


--
-- Name: idx_events_organizer_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_organizer_date ON public.events USING btree (organizer_id, event_date DESC);


--
-- Name: idx_events_organizer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_organizer_id ON public.events USING btree (organizer_id);


--
-- Name: idx_events_organizer_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_organizer_status ON public.events USING btree (organizer_id, status);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_events_venue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_venue ON public.events USING btree (venue_id);


--
-- Name: idx_organizer_accounts_stripe_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_accounts_stripe_account_id ON public.organizer_accounts USING btree (stripe_account_id);


--
-- Name: idx_organizer_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_accounts_user_id ON public.organizer_accounts USING btree (user_id);


--
-- Name: idx_organizer_analytics_organizer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_analytics_organizer ON public.organizer_analytics USING btree (organizer_id);


--
-- Name: idx_organizer_analytics_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_analytics_period ON public.organizer_analytics USING btree (period_type, period_start);


--
-- Name: idx_organizer_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_notifications_created ON public.organizer_notifications USING btree (created_at DESC);


--
-- Name: idx_organizer_notifications_organizer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_notifications_organizer ON public.organizer_notifications USING btree (organizer_id);


--
-- Name: idx_organizer_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_notifications_read ON public.organizer_notifications USING btree (is_read);


--
-- Name: idx_organizer_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_notifications_type ON public.organizer_notifications USING btree (type);


--
-- Name: idx_organizer_profiles_approved_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_profiles_approved_by ON public.organizer_profiles USING btree (approved_by);


--
-- Name: idx_organizer_profiles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_profiles_status ON public.organizer_profiles USING btree (status);


--
-- Name: idx_organizer_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizer_profiles_user_id ON public.organizer_profiles USING btree (user_id);


--
-- Name: idx_payment_disputes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_disputes_created_at ON public.payment_disputes USING btree (created_at DESC);


--
-- Name: idx_payment_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_disputes_status ON public.payment_disputes USING btree (status);


--
-- Name: idx_payment_disputes_stripe_charge_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_disputes_stripe_charge_id ON public.payment_disputes USING btree (stripe_charge_id);


--
-- Name: idx_payment_refunds_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_refunds_created_at ON public.payment_refunds USING btree (created_at DESC);


--
-- Name: idx_payment_refunds_payment_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_refunds_payment_transaction_id ON public.payment_refunds USING btree (payment_transaction_id);


--
-- Name: idx_payment_refunds_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_refunds_status ON public.payment_refunds USING btree (status);


--
-- Name: idx_payment_refunds_stripe_refund_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_refunds_stripe_refund_id ON public.payment_refunds USING btree (stripe_refund_id);


--
-- Name: idx_payment_transactions_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_booking_id ON public.payment_transactions USING btree (booking_id);


--
-- Name: idx_payment_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions USING btree (created_at DESC);


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_payment_transactions_stripe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_stripe_id ON public.payment_transactions USING btree (stripe_payment_intent_id);


--
-- Name: idx_revenue_splits_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_splits_booking_id ON public.revenue_splits USING btree (booking_id);


--
-- Name: idx_revenue_splits_organizer_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_splits_organizer_account ON public.revenue_splits USING btree (organizer_account_id);


--
-- Name: idx_revenue_splits_organizer_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_splits_organizer_created ON public.revenue_splits USING btree (organizer_account_id, created_at DESC);


--
-- Name: idx_revenue_splits_transfer_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_revenue_splits_transfer_status ON public.revenue_splits USING btree (transfer_status);


--
-- Name: idx_reviews_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_event ON public.reviews USING btree (event_id);


--
-- Name: idx_user_favorites_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_created_at ON public.user_favorites USING btree (created_at DESC);


--
-- Name: idx_user_favorites_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_event_id ON public.user_favorites USING btree (event_id);


--
-- Name: idx_user_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);


--
-- Name: idx_venues_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_venues_city ON public.venues USING btree (city);


--
-- Name: addresses trigger_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_address_updated_at();


--
-- Name: bookings trigger_set_booking_reference; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_booking_reference BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_reference();


--
-- Name: payment_transactions trigger_update_booking_payment_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_booking_payment_status AFTER UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_booking_payment_status();


--
-- Name: bookings trigger_update_event_tickets; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_event_tickets AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_event_tickets();


--
-- Name: user_favorites trigger_update_favorites_count_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_favorites_count_delete AFTER DELETE ON public.user_favorites FOR EACH ROW EXECUTE FUNCTION public.update_event_favorites_count();


--
-- Name: user_favorites trigger_update_favorites_count_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_favorites_count_insert AFTER INSERT ON public.user_favorites FOR EACH ROW EXECUTE FUNCTION public.update_event_favorites_count();


--
-- Name: bookings trigger_update_organizer_analytics; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_organizer_analytics AFTER INSERT ON public.bookings FOR EACH ROW WHEN (((new.booking_status)::text = 'confirmed'::text)) EXECUTE FUNCTION public.update_organizer_analytics();


--
-- Name: email_settings update_email_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON public.email_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_templates update_email_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: address_relationships address_relationships_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.address_relationships
    ADD CONSTRAINT address_relationships_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE CASCADE;


--
-- Name: admin_actions admin_actions_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: booking_tickets booking_tickets_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_tickets
    ADD CONSTRAINT booking_tickets_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: email_settings email_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_settings
    ADD CONSTRAINT email_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: email_templates email_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: email_templates email_templates_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: event_categories event_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: event_categories event_categories_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: events events_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: events events_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;


--
-- Name: organizer_accounts organizer_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_accounts
    ADD CONSTRAINT organizer_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: organizer_analytics organizer_analytics_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_analytics
    ADD CONSTRAINT organizer_analytics_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: organizer_analytics organizer_analytics_top_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_analytics
    ADD CONSTRAINT organizer_analytics_top_event_id_fkey FOREIGN KEY (top_event_id) REFERENCES public.events(id);


--
-- Name: organizer_notifications organizer_notifications_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_notifications
    ADD CONSTRAINT organizer_notifications_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: organizer_profiles organizer_profiles_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_profiles
    ADD CONSTRAINT organizer_profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: organizer_profiles organizer_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_profiles
    ADD CONSTRAINT organizer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_refunds payment_refunds_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_refunds
    ADD CONSTRAINT payment_refunds_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: revenue_splits revenue_splits_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_splits
    ADD CONSTRAINT revenue_splits_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: revenue_splits revenue_splits_organizer_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_splits
    ADD CONSTRAINT revenue_splits_organizer_account_id_fkey FOREIGN KEY (organizer_account_id) REFERENCES public.organizer_accounts(id);


--
-- Name: revenue_splits revenue_splits_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revenue_splits
    ADD CONSTRAINT revenue_splits_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id);


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

