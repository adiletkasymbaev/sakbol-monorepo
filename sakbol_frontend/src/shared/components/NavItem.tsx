import { NavLink } from "react-router-dom";

interface ComponentProps {
    link: string;
    activeClass: string;
    inactiveClass: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function NavItem({link, activeClass, inactiveClass, icon, children}: ComponentProps) {
    const content = (
        <NavLink
            to={link}
            className={({ isActive }) => `flex flex-col items-center text-[10px] transition-all font-semibold ${isActive ? activeClass : inactiveClass}`}
        >
            {icon}
            {children}
        </NavLink>
    );

    return content;
}

export default NavItem;