// Custom SVG icons for page headers - designed specifically for BrAINLabs

interface IconProps {
    size?: number;
    className?: string;
}

// Home Page - Neural Network Brain Icon
export const NeuralBrainIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Brain outline */}
        <path
            d="M12 3C8.5 3 6 5.5 6 8c0 1.5.5 2.8 1.5 3.8C6.5 12.8 6 14.5 6 16.5c0 2.5 2 4.5 4.5 4.5h3c2.5 0 4.5-2 4.5-4.5 0-2-.5-3.7-1.5-4.7C17.5 10.8 18 9.5 18 8c0-2.5-2.5-5-6-5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Neural connections */}
        <circle cx="9" cy="8" r="1" fill="currentColor" />
        <circle cx="15" cy="8" r="1" fill="currentColor" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
        <circle cx="9" cy="14" r="1" fill="currentColor" />
        <circle cx="15" cy="14" r="1" fill="currentColor" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
        {/* Connecting lines */}
        <path
            d="M9 8L12 11M15 8L12 11M12 11L9 14M12 11L15 14M9 14L12 17M15 14L12 17"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.6"
        />
    </svg>
);

// Projects Page - Research Lab Icon
export const ResearchLabIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Flask */}
        <path
            d="M9 3h6M10 3v4l-3 6v5a3 3 0 003 3h4a3 3 0 003-3v-5l-3-6V3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Liquid level */}
        <path
            d="M8 15h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Bubbles */}
        <circle cx="10.5" cy="16.5" r="0.5" fill="currentColor" />
        <circle cx="13.5" cy="17" r="0.5" fill="currentColor" />
        <circle cx="11.5" cy="18" r="0.5" fill="currentColor" />
    </svg>
);

// Team Page - Collaboration Network Icon
export const CollaborationIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Center person */}
        <circle cx="12" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
            d="M12 11c-2.5 0-4.5 1.5-4.5 3.5v2.5h9v-2.5c0-2-2-3.5-4.5-3.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Left person */}
        <circle cx="5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
            d="M3 13v1.5h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Right person */}
        <circle cx="19" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
            d="M17 13v1.5h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Connection lines */}
        <path
            d="M6.5 7.5L9.5 8.5M17.5 7.5L14.5 8.5"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
            strokeDasharray="2 2"
        />
    </svg>
);

// Publications Page - Academic Paper Icon
export const AcademicPaperIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Paper */}
        <path
            d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Folded corner */}
        <path
            d="M14 3v5h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Text lines */}
        <path
            d="M9 11h6M9 14h6M9 17h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Academic badge */}
        <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.2" />
        <path
            d="M16 14.5L16.7 16l1.3.2-1 .9.3 1.4-1.3-.7-1.3.7.3-1.4-1-.9 1.3-.2z"
            fill="currentColor"
        />
    </svg>
);

// Events Page - Workshop Calendar Icon
export const WorkshopCalendarIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Calendar */}
        <rect
            x="4"
            y="5"
            width="16"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Calendar header */}
        <path
            d="M4 9h16"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Calendar pins */}
        <path
            d="M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Event dots */}
        <circle cx="8" cy="13" r="1" fill="currentColor" />
        <circle cx="12" cy="13" r="1" fill="currentColor" />
        <circle cx="16" cy="13" r="1" fill="currentColor" />
        <circle cx="8" cy="17" r="1" fill="currentColor" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
);

// About Page - Mission Compass Icon
export const MissionCompassIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Compass circle */}
        <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Inner circle */}
        <circle
            cx="12"
            cy="12"
            r="2"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Compass needle */}
        <path
            d="M12 5L10 12l2-1 2 1-2-7z"
            fill="currentColor"
            opacity="0.8"
        />
        <path
            d="M12 19l2-7-2 1-2-1 2 7z"
            fill="currentColor"
            opacity="0.4"
        />
        {/* Cardinal points */}
        <path
            d="M12 4V2M12 22v-2M20 12h2M2 12h2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

// Contact Page - Communication Hub Icon
export const CommunicationHubIcon = ({ size = 24, className = '' }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Envelope */}
        <path
            d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Envelope flap */}
        <path
            d="M22 8L13.03 13.7a2 2 0 01-2.06 0L2 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Connection signals */}
        <circle cx="18" cy="4" r="1" fill="currentColor" />
        <circle cx="21" cy="6" r="1" fill="currentColor" />
        <circle cx="6" cy="4" r="1" fill="currentColor" />
        <circle cx="3" cy="6" r="1" fill="currentColor" />
        <path
            d="M18 4c.5-.5 1.5-1 3-2M6 4C5.5 3.5 4.5 3 3 2"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
        />
    </svg>
);
