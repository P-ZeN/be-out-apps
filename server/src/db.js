import pg from "pg";

const { Pool } = pg;
// ATTENTION: Remplacez les informations d'identification par les vôtres
const pool = new Pool({
    connectionString: "postgresql://beoutdbuser:dboutpass2025@163.172.26.222:5432/beout-db",
});

export default pool;
