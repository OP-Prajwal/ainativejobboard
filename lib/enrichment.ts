export type ProfileData = {
    source: 'github' | 'leetcode' | 'codeforces';
    username: string;
    stats: any;
    error?: string;
};

// GitHub API Headers - with optional token for higher rate limits
function getGitHubHeaders(): HeadersInit {
    const headers: HeadersInit = { 'User-Agent': 'AI-Native-JobBoard' };

    // Use token if available (increases rate limit from 60 to 5,000 requests/hour)
    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[GitHub] Using authenticated requests (5,000 req/hr limit)');
    } else {
        console.log('[GitHub] WARNING: No GITHUB_TOKEN set. Limited to 60 req/hr.');
    }

    return headers;
}

// 1. GitHub API
// Docs: https://docs.github.com/en/rest/users
export async function fetchGithubProfile(username: string): Promise<ProfileData> {
    try {
        const headers = getGitHubHeaders();

        // Fetch data independently to allow partial success (e.g. if events fail due to rate limit)
        const fetchUser = fetch(`https://api.github.com/users/${username}`, { headers }).then(r => r.ok ? r.json() : null);
        const fetchEvents = fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers }).then(r => r.ok ? r.json() : []);
        const fetchRepos = fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, { headers }).then(r => r.ok ? r.json() : []);

        const [userData, eventsData, reposData] = await Promise.all([fetchUser, fetchEvents, fetchRepos]);

        if (!userData) throw new Error(`GitHub User Not Found or Rate Limited`);


        // Calculate Stars & Top Languages
        let totalStars = 0;
        const languages: Record<string, number> = {};
        const repoStars: Record<string, number> = {};

        if (Array.isArray(reposData)) {
            reposData.forEach((repo: any) => {
                totalStars += repo.stargazers_count;
                repoStars[repo.full_name] = repo.stargazers_count; // Store stars by "owner/repo"
                // Also store by simple name just in case event uses simple name (it usually uses full name in repo.name)
                repoStars[repo.name] = repo.stargazers_count;

                if (repo.language) {
                    languages[repo.language] = (languages[repo.language] || 0) + 1;
                }
            });
        }

        // Identify Top 5 Popular Repos (by stars)
        const popularRepos = new Set(
            reposData
                .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
                .slice(0, 5)
                .map((r: any) => r.name) // Use simple name to match event.repo.name often
        );
        // Also add full names to be safe
        reposData.slice(0, 5).forEach((r: any) => popularRepos.add(r.full_name));


        // Calculate Recent Commits & Extract Messages (All Repos)
        let recentCommits = 0;
        let recentActivity: { repo: string, message: string, date: string, stars: number }[] = [];

        if (Array.isArray(eventsData)) {
            const pushEvents = eventsData.filter((e: any) => e.type === 'PushEvent');

            recentCommits = pushEvents.reduce((acc: number, e: any) => {
                const count = e.payload?.size ?? e.payload?.commits?.length ?? 1;
                return acc + count;
            }, 0);

            // Try to get commits from Events API first
            for (const event of pushEvents) {
                const commits = event.payload?.commits || [];
                for (const commit of commits) {
                    recentActivity.push({
                        repo: event.repo.name,
                        message: commit.message || 'Commit',
                        date: event.created_at,
                        stars: repoStars[event.repo.name] || 0
                    });
                }
            }
        }

        // FALLBACK: If Events API didn't provide commits, fetch directly from repos
        if (recentActivity.length < 10 && Array.isArray(reposData) && reposData.length > 0) {
            console.log(`[Enrichment] Events API had ${recentActivity.length} commits, fetching from Repos API...`);

            // Get commits from top 10 most recently pushed repos (maximum coverage)
            const topRepos = reposData
                .sort((a: any, b: any) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
                .slice(0, 10);

            for (const repo of topRepos) {
                try {
                    const commitsRes = await fetch(
                        `https://api.github.com/repos/${repo.full_name}/commits?per_page=50`,
                        { headers: getGitHubHeaders() }
                    );

                    if (commitsRes.ok) {
                        const commits = await commitsRes.json();
                        for (const commit of commits) {
                            recentActivity.push({
                                repo: repo.full_name,
                                message: commit.commit?.message || 'Commit',
                                date: commit.commit?.author?.date || new Date().toISOString(),
                                stars: repo.stargazers_count || 0
                            });
                        }
                    }
                } catch (e) {
                    console.error(`[Enrichment] Failed to fetch commits for ${repo.full_name}:`, e);
                }
            }

            // Update total commit count
            recentCommits = Math.max(recentCommits, recentActivity.length);
        }

        console.log(`[Enrichment] Captured ${recentActivity.length} commits total`);

        // Sort languages by frequency
        const topLanguages = Object.entries(languages)
            .sort(([, a], [, b]) => b - a)
            .map(([lang]) => lang)
            .slice(0, 3); // Top 3

        return {
            source: 'github',
            username,
            stats: {
                location: userData.location,
                publicRepos: userData.public_repos,
                followers: userData.followers,
                bio: userData.bio,
                company: userData.company,
                recentCommits: recentCommits,
                recentActivity: recentActivity,
                totalStars: totalStars,
                topLanguages: topLanguages
            }
        };
    } catch (e: any) {
        return { source: 'github', username, stats: null, error: e.message };
    }
}

// 2. LeetCode (Unofficial GraphQL)
// We use a common public proxy or direct GraphQL if possible. 
// For stability in this demo, let's use a direct GraphQL fetch mimicking a browser.
export async function fetchLeetCodeProfile(username: string): Promise<ProfileData> {
    try {
        const query = `
            query userProblemsSolved($username: String!) {
                allQuestionsCount { difficulty count }
                matchedUser(username: $username) {
                    submitStats {
                        acSubmissionNum { difficulty count }
                    }
                    profile { ranking }
                }
            }
        `;

        const res = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com'
            },
            body: JSON.stringify({ query, variables: { username } })
        });

        if (!res.ok) throw new Error(`LeetCode Status ${res.status}`);
        const data = await res.json();

        if (data.errors) throw new Error(data.errors[0].message);

        const stats = data.data.matchedUser?.submitStats?.acSubmissionNum || [];
        // Extract "All" count
        const solved = stats.find((s: any) => s.difficulty === 'All')?.count || 0;

        return {
            source: 'leetcode',
            username,
            stats: {
                solvedProblems: solved,
                ranking: data.data.matchedUser?.profile?.ranking || 0
            }
        };
    } catch (e: any) {
        return { source: 'leetcode', username, stats: null, error: e.message };
    }
}

// 3. Codeforces API
// Docs: https://codeforces.com/api/help/methods#user.info
export async function fetchCodeforcesProfile(username: string): Promise<ProfileData> {
    try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
        if (!res.ok) throw new Error(`Codeforces Status ${res.status}`);
        const data = await res.json();

        if (data.status !== 'OK') throw new Error(data.comment || 'Unknown Error');

        const user = data.result[0];

        return {
            source: 'codeforces',
            username,
            stats: {
                rating: user.rating,
                rank: user.rank,
                maxRating: user.maxRating,
                maxRank: user.maxRank
            }
        };
    } catch (e: any) {
        return { source: 'codeforces', username, stats: null, error: e.message };
    }
}

// Aggregator
export async function enrichCandidate(profiles: { github?: string, leetcode?: string, codeforces?: string }) {
    const results: any = {};

    if (profiles.github) results.github = await fetchGithubProfile(profiles.github);
    if (profiles.leetcode) results.leetcode = await fetchLeetCodeProfile(profiles.leetcode);
    if (profiles.codeforces) results.codeforces = await fetchCodeforcesProfile(profiles.codeforces);

    return results;
}
