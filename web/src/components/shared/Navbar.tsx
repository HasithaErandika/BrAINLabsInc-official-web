import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrainLabsHorizontalLogo } from '@/components/ui/BrainLabsLogo';
import React from 'react';

export const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const location = useLocation();

    const navLinks = [
        { label: 'Home', path: '/' },
        { label: 'Projects', path: '/projects' },
        { label: 'Team', path: '/team' },
        { label: 'Publications', path: '/publications' },
        { label: 'Events', path: '/events' },
        { label: 'Blog', path: '/blog' },
        { label: 'About', path: '/about' },
        { label: 'Contact', path: '/contact' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-300">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-1 group" onClick={() => setIsOpen(false)}>
                        <BrainLabsHorizontalLogo width={220} height={55} className="group-hover:opacity-80 transition-opacity" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-all relative group ${
                                    isActive(link.path)
                                        ? 'text-primary'
                                        : 'text-foreground/70 hover:text-primary'
                                }`}
                            >
                                {link.label}
                                {isActive(link.path) && (
                                    <span className="absolute -bottom-[20px] left-0 right-0 h-0.5 bg-primary" />
                                )}
                                <span className="absolute -bottom-[20px] left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden py-6 bg-background border-t border-border/50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`text-lg font-medium px-4 py-2 rounded-lg transition-colors ${
                                        isActive(link.path)
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-foreground/70 hover:bg-secondary'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};
