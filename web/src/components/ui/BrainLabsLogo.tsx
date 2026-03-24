interface LogoProps {
    width?: number;
    height?: number;
    className?: string;
}

// Logo only (for favicon and compact displays)
export const BrainLabsLogoIcon = ({ width = 100, height = 100, className = '' }: LogoProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 400 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Brain Labs Icon"
        >
            <g transform="translate(100, 20)">
                {/* Main Black Circuit Lines & Face Profile */}
                <path
                    d="M130 60 V100 L150 120 V160 L130 180 V200 M130 200 L130 180
                 M130 140 L110 120 V80
                 M160 80 V130 L190 160 H230 L250 140
                 M200 60 L180 80 V120
                 M220 80 L200 100 V120 H230
                 M250 140 V100 C250 70 230 50 190 50 H160
                 M250 140 L260 150 V170 L270 175 L260 185 L265 195 L250 210 C230 230 180 220 180 180"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Nodes (Circles) - Hollow */}
                <circle cx="110" cy="80" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="130" cy="60" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="130" cy="200" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="150" cy="210" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="110" cy="150" r="6" stroke="currentColor" strokeWidth="4" fill="white" />

                {/* Colored Nodes (Brain Activity) */}
                <circle cx="220" cy="80" r="6" fill="#EA4335" stroke="currentColor" strokeWidth="2" />
                <circle cx="240" cy="100" r="6" fill="#4285F4" stroke="currentColor" strokeWidth="2" />
                <circle cx="220" cy="120" r="6" fill="#34A853" stroke="currentColor" strokeWidth="2" />
            </g>
        </svg>
    );
};

// Full logo with text (for headers and large displays)
const BrainLabsLogo = ({ width = 500, height = 500, className = '' }: LogoProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 400 450"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Brain Labs Logo"
        >
            {/* --- ICON SECTION --- */}
            <g transform="translate(0, -20)">
                {/* Main Black Circuit Lines & Face Profile */}
                <path
                    d="M130 60 V100 L150 120 V160 L130 180 V200 M130 200 L130 180
                 M130 140 L110 120 V80
                 M160 80 V130 L190 160 H230 L250 140
                 M200 60 L180 80 V120
                 M220 80 L200 100 V120 H230
                 M250 140 V100 C250 70 230 50 190 50 H160
                 M250 140 L260 150 V170 L270 175 L260 185 L265 195 L250 210 C230 230 180 220 180 180"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Nodes (Circles) - Hollow */}
                <circle cx="110" cy="80" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="130" cy="60" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="130" cy="200" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="150" cy="210" r="6" stroke="currentColor" strokeWidth="4" fill="white" />
                <circle cx="110" cy="150" r="6" stroke="currentColor" strokeWidth="4" fill="white" />

                {/* Colored Nodes (Brain Activity) */}
                <circle cx="220" cy="80" r="6" fill="#EA4335" stroke="currentColor" strokeWidth="2" />
                <circle cx="240" cy="100" r="6" fill="#4285F4" stroke="currentColor" strokeWidth="2" />
                <circle cx="220" cy="120" r="6" fill="#34A853" stroke="currentColor" strokeWidth="2" />
            </g>

            {/* --- TEXT SECTION --- */}
            <text
                x="200"
                y="300"
                textAnchor="middle"
                fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                fontWeight="bold"
                fontSize="48"
                letterSpacing="2"
                fill="currentColor"
                style={{ textTransform: 'uppercase' }}
            >
                Brain Labs
            </text>

            <text
                x="200"
                y="335"
                textAnchor="middle"
                fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                fontWeight="400"
                fontSize="14"
                fill="currentColor"
                opacity="0.7"
            >
                Brain-Inspired AI & Neuroinformatics
            </text>

            <text
                x="200"
                y="355"
                textAnchor="middle"
                fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                fontWeight="400"
                fontSize="14"
                fill="currentColor"
                opacity="0.7"
            >
                Research Group
            </text>
        </svg>
    );
};

// Full logo with text (horizontal layout for headers)
export const BrainLabsHorizontalLogo = ({ width = 200, height = 50, className = '' }: LogoProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 300 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Brain Labs Logo"
        >
            <g transform="translate(0, 5) scale(0.25)">
                {/* Icon Scaled Down */}
                <path
                    d="M130 60 V100 L150 120 V160 L130 180 V200 M130 200 L130 180
                 M130 140 L110 120 V80
                 M160 80 V130 L190 160 H230 L250 140
                 M200 60 L180 80 V120
                 M220 80 L200 100 V120 H230
                 M250 140 V100 C250 70 230 50 190 50 H160
                 M250 140 L260 150 V170 L270 175 L260 185 L265 195 L250 210 C230 230 180 220 180 180"
                    stroke="currentColor"
                    strokeWidth="12" /* Thicker stroke for smaller scale */
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
                <circle cx="110" cy="80" r="10" stroke="currentColor" strokeWidth="8" fill="white" />
                <circle cx="130" cy="60" r="10" stroke="currentColor" strokeWidth="8" fill="white" />
                <circle cx="130" cy="200" r="10" stroke="currentColor" strokeWidth="8" fill="white" />
                <circle cx="150" cy="210" r="10" stroke="currentColor" strokeWidth="8" fill="white" />
                <circle cx="110" cy="150" r="10" stroke="currentColor" strokeWidth="8" fill="white" />
                <circle cx="220" cy="80" r="10" fill="#EA4335" stroke="currentColor" strokeWidth="4" />
                <circle cx="240" cy="100" r="10" fill="#4285F4" stroke="currentColor" strokeWidth="4" />
                <circle cx="220" cy="120" r="10" fill="#34A853" stroke="currentColor" strokeWidth="4" />
            </g>

            {/* Text Section */}
            <text
                x="80"
                y="38"
                fontFamily="'Inter', sans-serif"
                fontWeight="800"
                fontSize="28"
                letterSpacing="-0.5"
                fill="currentColor"
            >
                BrAIN Labs
            </text>
            <text
                x="80"
                y="52"
                fontFamily="'Inter', sans-serif"
                fontWeight="500"
                fontSize="10"
                letterSpacing="1"
                fill="currentColor"
                opacity="0.6"
            >
                AI & NEUROINFORMATICS
            </text>
        </svg>
    );
};

export default BrainLabsLogo;
