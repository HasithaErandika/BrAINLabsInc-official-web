import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { SEO } from '@/components/shared/SEO';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Mail,
    GraduationCap,
    Search,
    Zap,
    MapPin,
    Briefcase,
} from 'lucide-react';
import { api, type PublicResearcher } from '@/lib/api';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const TeamMemberProfile = () => {
    const { slug } = useParams<{ slug: string }>();
    const [researcher, setResearcher] = useState<PublicResearcher | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (!slug) return;

        setIsLoading(true);
        setNotFound(false);
        api.researchers.get(slug)
            .then(setResearcher)
            .catch(() => setNotFound(true))
            .finally(() => setIsLoading(false));
    }, [slug]);

    if (!isLoading && notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Researcher not found</h2>
                    <Link to="/team">
                        <Button variant="outline">Back to Team</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const name = researcher
        ? `${researcher.member.first_name} ${researcher.member.second_name}`
        : '';
    const initials = researcher
        ? `${researcher.member.first_name[0]}${researcher.member.second_name[0]}`
        : '';

    return (
        <div className="relative min-h-screen bg-background">
            {researcher && (
                <SEO
                    title={`${name} | BrAIN Labs Team`}
                    description={`${researcher.occupation ?? 'Researcher'} at BrAIN Labs — ${researcher.workplace ?? ''}`}
                />
            )}

            {/* ── Hero Section ──────────────────────────────────────── */}
            <section className="relative pt-24 md:pt-32 pb-16 overflow-hidden min-h-[60vh] flex flex-col justify-center border-b border-border/40">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-background" />
                <div className="absolute left-1/3 top-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-7xl mx-auto"
                    >
                        <motion.div variants={itemVariants} className="mb-8">
                            <Link to="/team">
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors bg-primary/5 rounded-full px-4">
                                    <ArrowLeft size={16} />
                                    Back to Team
                                </Button>
                            </Link>
                        </motion.div>

                        <div className="grid lg:grid-cols-[auto_1fr_400px] gap-12 lg:gap-16 items-start">
                            {/* Column 1: Avatar */}
                            <motion.div variants={itemVariants} className="shrink-0 relative group flex flex-col items-start gap-3">
                                <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/10">
                                    <Zap size={10} />
                                    Team Member
                                </div>
                                {isLoading ? (
                                    <Skeleton className="w-40 h-40 md:w-56 md:h-56 rounded-3xl" />
                                ) : (
                                    <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-primary/10">
                                        {researcher?.image_url ? (
                                            <img
                                                src={researcher.image_url}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <span className="text-5xl font-bold text-primary/40">{initials}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>

                            {/* Column 2: Core Info */}
                            <motion.div variants={itemVariants} className="space-y-6 lg:pt-10">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-10 w-3/4" />
                                        <Skeleton className="h-6 w-1/2" />
                                        <Skeleton className="h-6 w-2/3" />
                                        <div className="flex gap-4 pt-4">
                                            <Skeleton className="h-10 w-24 rounded-full" />
                                        </div>
                                    </>
                                ) : researcher && (
                                    <>
                                        <div className="space-y-3">
                                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                                                {name}
                                            </h1>
                                            {researcher.occupation && (
                                                <p className="text-xl md:text-2xl text-primary/90 font-semibold tracking-tight">
                                                    {researcher.occupation}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 text-sm md:text-base text-muted-foreground/80">
                                            {researcher.workplace && (
                                                <div className="flex items-center gap-3">
                                                    <Briefcase size={18} className="text-primary/60 shrink-0" />
                                                    <span>{researcher.workplace}</span>
                                                </div>
                                            )}
                                            {researcher.country && (
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={18} className="text-primary/60 shrink-0" />
                                                    <span>{researcher.country}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-6">
                                            {researcher.member.contact_email && (
                                                <Button size="sm" variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5 h-10 px-6" asChild>
                                                    <a href={`mailto:${researcher.member.contact_email}`}>
                                                        <Mail size={14} />
                                                        Email
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </motion.div>

                            {/* Column 3: Quick Insights */}
                            <motion.div
                                variants={itemVariants}
                                className="hidden lg:block space-y-8 p-6 md:p-8 rounded-3xl border border-primary/10 bg-primary/[0.02] backdrop-blur-sm self-start"
                            >
                                {isLoading ? (
                                    <div className="space-y-6">
                                        <Skeleton className="h-6 w-1/3" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                ) : researcher && (
                                    <>
                                        {/* Education */}
                                        {researcher.educational_background && researcher.educational_background.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-2">
                                                    <GraduationCap size={14} strokeWidth={3} />
                                                    Education
                                                </h3>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {researcher.educational_background.map((ed) => (
                                                        <Badge key={ed.id} variant="secondary" className="bg-background/80 hover:bg-primary/5 border-border/50 text-[10px] px-2 py-0.5">
                                                            {ed.degree}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Ongoing Research */}
                                        {researcher.ongoing_research && researcher.ongoing_research.length > 0 && (
                                            <div className="space-y-4 pt-4 border-t border-primary/5">
                                                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-2">
                                                    <Zap size={14} strokeWidth={3} />
                                                    Ongoing Research
                                                </h3>
                                                <div className="space-y-3">
                                                    {researcher.ongoing_research.map((res) => (
                                                        <div key={res.id} className="flex gap-3">
                                                            <div className="w-1 h-auto bg-primary/20 rounded-full shrink-0" />
                                                            <p className="text-[11px] text-foreground/80 leading-relaxed italic line-clamp-2">{res.title}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Bio Section ───────────────────────────────────────── */}
            {!isLoading && researcher?.bio && (
                <section className="py-12 md:py-20 relative px-4 md:px-8">
                    <div className="container mx-auto max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <div className="flex items-center gap-3 border-b border-border/40 pb-4 mb-8">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Search size={20} className="text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold">About</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                                {researcher.bio}
                            </p>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ── Footer Link ───────────────────────────────────────── */}
            <section className="py-20 border-t border-border/40">
                <div className="container mx-auto px-4 text-center">
                    <Link to="/team">
                        <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/5 rounded-full px-8 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Meet More Researchers
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};