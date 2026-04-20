import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollaborationIcon } from '@/components/ui/PageIcons';
import { Mail, Globe, UserPlus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/shared/SEO';
import { api, type PublicResearcher } from '@/lib/api';

// ── Shared card component ─────────────────────────────────────────────────────
const MemberCard = ({ researcher, idx }: { researcher: PublicResearcher; idx: number }) => {
    const name = `${researcher.member.first_name} ${researcher.member.second_name}`;
    const initials = `${researcher.member.first_name[0]}${researcher.member.second_name[0]}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.07, duration: 0.5 }}
            whileHover={{ y: -5 }}
        >
            <Card className="h-full border-border/50 hover:shadow-lg transition-all duration-300 group bg-card/80 hover:border-primary/40">
                <CardHeader className="pb-3 pt-6 px-6">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="shrink-0">
                            {researcher.image_url ? (
                                <img
                                    src={researcher.image_url}
                                    alt={name}
                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center ring-1 ring-border bg-gradient-to-br from-primary/15 to-primary/5 group-hover:ring-primary/30 transition-all">
                                    <span className="text-xl font-bold text-primary/80">{initials}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <CardTitle className="text-base font-semibold mb-1 transition-colors leading-snug group-hover:text-primary">
                                {name}
                            </CardTitle>
                            {researcher.occupation && (
                                <CardDescription className="text-xs font-semibold mb-0.5 uppercase tracking-wide text-primary">
                                    {researcher.occupation}
                                </CardDescription>
                            )}
                            {researcher.workplace && (
                                <p className="text-xs text-muted-foreground/80 truncate">{researcher.workplace}</p>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 space-y-4">
                    {/* Bio */}
                    {researcher.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{researcher.bio}</p>
                    )}

                    {/* Education badges */}
                    {researcher.educational_background && researcher.educational_background.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">Education</div>
                            <div className="flex flex-wrap gap-1.5">
                                {researcher.educational_background.slice(0, 2).map((ed) => (
                                    <Badge
                                        key={ed.id}
                                        variant="secondary"
                                        className="text-[10px] px-2 py-0.5 font-medium border bg-primary/6 text-foreground/80 border-primary/10"
                                    >
                                        {ed.degree}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    <div className="flex gap-4 pt-3 border-t border-border/40">
                        {researcher.member.contact_email && (
                            <a
                                href={`mailto:${researcher.member.contact_email}`}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Mail size={13} />
                                Email
                            </a>
                        )}
                        {researcher.workplace && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                                <Globe size={13} />
                                {researcher.country || researcher.workplace}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export const Team = () => {
    const [researchers, setResearchers] = useState<PublicResearcher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.researchers.list()
            .then(setResearchers)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen">
            <SEO
                title="Our Team"
                description="Meet the multidisciplinary team of experts pushing the boundaries of AI and neuroscience research at BrAIN Labs."
                keywords={['AI Researchers', 'Neuroscience Team', 'BrAIN Labs Team', 'Research Scientists']}
            />

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative pt-24 md:pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-background" />
                <div className="absolute left-0 top-20 w-96 h-96 bg-primary/4 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl lg:pl-4"
                    >
                        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary px-3 py-1.5 rounded-full mb-5 border border-primary/15 text-xs font-medium uppercase tracking-wide">
                            <CollaborationIcon size={14} />
                            Our Team
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight">
                            Meet the{' '}
                            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                                Researchers
                            </span>
                        </h1>

                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            A multidisciplinary team of experts pushing the boundaries of AI and neuroscience research.
                        </p>

                        {!loading && !error && (
                            <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground text-base">{researchers.length}</span>
                                <span>active researchers across AI, ML, and neuroscience</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* ── Members Grid ──────────────────────────────────────── */}
            <section className="py-8 md:py-14">
                <div className="container mx-auto px-4 lg:pl-8">

                    {loading && (
                        <div className="flex items-center gap-3 text-muted-foreground py-20 justify-center">
                            <Loader2 size={20} className="animate-spin text-primary" />
                            <span className="text-sm">Loading team…</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-20">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && researchers.length === 0 && (
                        <div className="text-center py-20">
                            <CollaborationIcon size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground text-sm">No researchers listed yet.</p>
                        </div>
                    )}

                    {!loading && !error && researchers.length > 0 && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-3 mb-8"
                            >
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Current Members</h2>
                                <span className="ml-1 text-xs text-muted-foreground font-medium bg-primary/8 border border-primary/15 px-2 py-0.5 rounded-full">
                                    {researchers.length}
                                </span>
                            </motion.div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {researchers.map((researcher, idx) => (
                                    <Link key={researcher.member_id} to={`/team/${researcher.member.slug}`} className="block h-full">
                                        <MemberCard researcher={researcher} idx={idx} />
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <section className="py-20 border-t border-border/40">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl mx-auto text-center space-y-6"
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                            <UserPlus size={24} className="text-primary" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Join Our Team</h2>
                        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                            We regularly accept interns and PhD candidates. Check out our open positions or get in touch regarding opportunities.
                        </p>
                        <Link to="/contact">
                            <Button className="h-10 px-7 text-sm bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-md hover:shadow-lg transition-all">
                                <Mail className="mr-2" size={14} />
                                Contact Us
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};
