import { supabase } from './supabaseClient';

export async function checkAndAwardBadges(userId) {
    if (!userId) return;

    // 1. Fetch User Stats
    // Count completed requests (as learner or provider)
    const { count: sessionCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .or(`learner_id.eq.${userId},provider_id.eq.${userId}`);

    // Count 5-star reviews received
    const { count: fiveStarCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', userId)
        .eq('rating', 5);

    // Count skills listed
    const { count: skillsCount } = await supabase
        .from('skills')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', userId);

    // 2. Define Badge Rules (Map title to condition)
    // Note: This relies on badge titles being constant. Ideally use slugs/IDs.
    const rules = [
        { title: 'First Step', condition: sessionCount >= 1 },
        { title: 'Top Rated', condition: fiveStarCount >= 1 },
        { title: 'Skill Master', condition: skillsCount >= 3 },
        // Add more logic for 'Social Butterfly' later (group sessions)
    ];

    // 3. Fetch Badges Metadata
    const { data: allBadges } = await supabase.from('badges').select('*');
    if (!allBadges) return;

    // 4. Fetch User's Current Badges
    const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

    const ownedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    // 5. Check and Award
    for (const rule of rules) {
        if (rule.condition) {
            const badgeMeta = allBadges.find(b => b.title === rule.title);
            if (badgeMeta && !ownedBadgeIds.has(badgeMeta.id)) {

                await supabase.from('user_badges').insert({
                    user_id: userId,
                    badge_id: badgeMeta.id
                });

                // Optional: Notify user
                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'badge_awarded',
                    message: `You earned a new badge: ${badgeMeta.title}!`,
                    link: '/profile',
                    is_read: false
                });

                console.log(`Awarded badge: ${rule.title}`);
            }
        }
    }
}
