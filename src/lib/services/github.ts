export interface GitHubRepoItem {
  name: string;
  description: string | null;
  html_url: string;
  stars: number;
  forks: number;
  primary_language: string | null;
  is_fork: boolean;
  updated_at: string;
}

export interface GitHubEvidenceResult {
  username: string;
  profile_url: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos_count: number;
  total_stars: number;
  languages: Record<string, { bytes: number; percentage: number }>;
  top_repos: GitHubRepoItem[];
  disclaimer: string;
}

export const GITHUB_DISCLAIMER =
  "EVIDENCE NOTICE: Repository-derived skills represent metadata observed in public repositories and open-source commits. They do NOT constitute verified proof of professional proficiency.";

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "PlacementHub-Campus-System/1.0",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token && !token.includes("placeholder") && token.trim() !== "") {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

/**
 * Fetches public GitHub metadata and repository language evidence for a student.
 * Never accesses private repositories. Strictly handles 404, rate limits, and network errors.
 */
export async function fetchGitHubPublicEvidence(
  rawUsername: string
): Promise<{ success: boolean; data?: GitHubEvidenceResult; error?: string }> {
  const username = rawUsername.trim().replace(/^@/, "");
  if (!username) {
    return { success: false, error: "Please enter a valid GitHub username." };
  }

  // GitHub username regex validation (alphanumeric and single hyphens)
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
    return { success: false, error: "Invalid GitHub username format." };
  }

  const headers = getGitHubHeaders();

  try {
    // 1. Fetch User Profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      next: { revalidate: 3600 }, // Cache up to 1 hour
    });

    if (userRes.status === 404) {
      return { success: false, error: `GitHub user '${username}' not found. Please verify the handle.` };
    }

    if (userRes.status === 403) {
      const resetHeader = userRes.headers.get("x-ratelimit-reset");
      const resetTime = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString() : "soon";
      return {
        success: false,
        error: `GitHub API rate limit reached. Access will automatically reset at ${resetTime}.`,
      };
    }

    if (!userRes.ok) {
      return { success: false, error: `GitHub API error: ${userRes.statusText} (${userRes.status}).` };
    }

    const userData = await userRes.json();

    // 2. Fetch Public Repositories (Page 1 up to 100)
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=public`,
      { headers, next: { revalidate: 1800 } }
    );

    if (!reposRes.ok) {
      return { success: false, error: "Failed to retrieve public repositories from GitHub." };
    }

    const reposData: any[] = await reposRes.json();
    if (!Array.isArray(reposData)) {
      return { success: false, error: "Unexpected response format from GitHub repositories API." };
    }

    // Filter out forks for direct skill evidence or prioritize source repos
    const sourceRepos = reposData.filter((r) => !r.fork);
    const reposToAnalyze = sourceRepos.length > 0 ? sourceRepos : reposData;

    let totalStars = 0;
    const topRepos: GitHubRepoItem[] = [];

    for (const r of reposToAnalyze) {
      totalStars += r.stargazers_count || 0;
      topRepos.push({
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        primary_language: r.language,
        is_fork: r.fork,
        updated_at: r.updated_at,
      });
    }

    // Sort by stars and recency
    topRepos.sort((a, b) => b.stars - a.stars);

    // 3. Aggregate languages across top 10 repos
    const sampleRepos = topRepos.slice(0, 10);
    const languageBytes: Record<string, number> = {};
    let totalBytes = 0;

    // Fetch language bytes in parallel for top repositories
    const languagePromises = sampleRepos.map(async (repo) => {
      try {
        const langRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`,
          { headers, next: { revalidate: 3600 } }
        );
        if (langRes.ok) {
          const langs = await langRes.json();
          for (const [lang, bytes] of Object.entries(langs)) {
            const b = Number(bytes);
            languageBytes[lang] = (languageBytes[lang] || 0) + b;
            totalBytes += b;
          }
        }
      } catch {
        // Soft fail per repo
      }
    });

    await Promise.all(languagePromises);

    // If language endpoints produced no bytes (e.g. empty or API limits), fall back to primary languages count
    const languageBreakdown: Record<string, { bytes: number; percentage: number }> = {};
    if (totalBytes > 0) {
      for (const [lang, bytes] of Object.entries(languageBytes)) {
        languageBreakdown[lang] = {
          bytes,
          percentage: Math.round((bytes / totalBytes) * 100),
        };
      }
    } else {
      // Fallback: estimate from primary language distribution
      const counts: Record<string, number> = {};
      let totalLangs = 0;
      for (const r of topRepos) {
        if (r.primary_language) {
          counts[r.primary_language] = (counts[r.primary_language] || 0) + 1;
          totalLangs++;
        }
      }
      for (const [lang, cnt] of Object.entries(counts)) {
        languageBreakdown[lang] = {
          bytes: cnt * 1000,
          percentage: totalLangs > 0 ? Math.round((cnt / totalLangs) * 100) : 0,
        };
      }
    }

    return {
      success: true,
      data: {
        username: userData.login,
        profile_url: userData.html_url,
        avatar_url: userData.avatar_url,
        name: userData.name,
        bio: userData.bio,
        public_repos_count: userData.public_repos || topRepos.length,
        total_stars: totalStars,
        languages: languageBreakdown,
        top_repos: topRepos.slice(0, 8),
        disclaimer: GITHUB_DISCLAIMER,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network failure connecting to GitHub API: ${err?.message || "Connection timed out."}`,
    };
  }
}
