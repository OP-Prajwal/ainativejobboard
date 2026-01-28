import Link from 'next/link';

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center font-bold text-white">
                        FR
                    </div>
                    <span className="font-bold text-xl tracking-tight">FinalRound<span className="text-violet-400">AI</span></span>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
                    <Link href="#" className="hover:text-white transition-colors">Companies</Link>
                    <Link href="#" className="hover:text-white transition-colors">Salaries</Link>
                    <Link href="#" className="hover:text-white transition-colors">Career Advice</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="#" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white">
                        Sign In
                    </Link>
                    <Link href="#" className="px-4 py-2 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-slate-200 transition-colors">
                        For Employers
                    </Link>
                </div>
            </div>
        </header>
    );
}
