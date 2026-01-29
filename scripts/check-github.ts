
async function check() {
    const res = await fetch('https://api.github.com/users/mohit782005/events/public?per_page=100', {
        headers: { 'User-Agent': 'Node.js' }
    });
    const events = await res.json();

    console.log(`Total events: ${events.length}`);

    const pushEvents = events.filter((e: any) => e.type === 'PushEvent');
    console.log(`Push events: ${pushEvents.length}`);

    let totalCommits = 0;
    for (const event of pushEvents) {
        const commits = event.payload?.commits || [];
        const size = event.payload?.size || 0;
        console.log(`- ${event.repo.name}: ${commits.length} commits in payload, size=${size}`);

        if (commits.length > 0) {
            commits.forEach((c: any) => console.log(`   * ${c.message?.slice(0, 50)}`));
        }
        totalCommits += commits.length || size;
    }

    console.log(`\nTotal commits available: ${totalCommits}`);
}

check();
