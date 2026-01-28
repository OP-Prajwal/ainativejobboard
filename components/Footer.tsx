import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-slate-900 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="font-bold text-slate-100 mb-4">FinalRoundAI</h4>
                        <p className="text-slate-400 text-sm">
                            The AI-native job board for the next generation of tech talent.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-100 mb-4">Candidates</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/jobs" className="hover:text-violet-400">Browse Jobs</Link></li>
                            <li><Link href="#" className="hover:text-violet-400">Companies</Link></li>
                            <li><Link href="#" className="hover:text-violet-400">Salaries</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-100 mb-4">Employers</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#" className="hover:text-violet-400">Post a Job</Link></li>
                            <li><Link href="#" className="hover:text-violet-400">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-violet-400">Hiring Solutions</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-100 mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#" className="hover:text-violet-400">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-violet-400">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-8 text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} FinalRoundAI Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
