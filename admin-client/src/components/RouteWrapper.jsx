import React from "react";

const RouteWrapper = ({ component: Component, user, ...props }) => {
    console.log("RouteWrapper rendering component with user:", user);
    console.log("Component:", Component);

    if (!user) {
        return <div>Loading user...</div>;
    }

    // Ensure we're passing the user prop explicitly
    return React.createElement(Component, { user, ...props });
};

export default RouteWrapper;
