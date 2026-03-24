import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    type?: string;
    image?: string;
    url?: string;
}

export const SEO = ({
    title,
    description,
    keywords,
    type = 'website',
    image = '/og-image.jpg', // Default OG image if available
    url = typeof window !== 'undefined' ? window.location.href : 'https://brainlabsinc.org'
}: SEOProps) => {
    const siteTitle = "BrAIN Labs - Braininspired AI and Neuroinformatics Lab";
    const defaultDescription = "BrAIN Labs - Braininspired AI and Neuroinformatics Lab. We explore the intersection of Artificial Intelligence, Machine Learning, and Neuroscience to develop innovative AI solutions.";
    const defaultKeywords = [
        "AI research",
        "machine learning",
        "neuroscience",
        "neuromorphic computing",
        "LLM",
        "spiking neural networks",
        "computational neuroscience",
        "BrAIN Labs"
    ];

    const fullTitle = title ? `${title} | BrAIN Labs` : siteTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords && keywords.length > 0 ? keywords.join(", ") : defaultKeywords.join(", ");

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};
