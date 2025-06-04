import React from 'react';

interface User {
    name: string;
    lastName: string;
}

interface UserAccountNavProps {
    user: User;
}

export const UserAccountNav: React.FC<UserAccountNavProps> = ({ user }) => {
    return (
        <span className="hidden text-sm font-medium lg:block" data-cy="user-name">
            Connecté : {user.name} {user.lastName}
        </span>
    );
};

export default UserAccountNav;