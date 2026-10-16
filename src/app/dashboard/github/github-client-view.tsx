"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  fetchGitHubEvidenceAction,
  saveStudentGitHubEvidenceAction,
} from "@/app/actions/github";
import type { GitHubEvidenceResult } from "@/lib/services/github";
import {
  Github,
  Search,
  Star,
  GitFork,
  Code2,
  ExternalLink,
  ShieldAlert,
  Save,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";

interface Props {
  savedEvidence?: any;
}

export function GitHubClientView({ savedEvidence }: Props) {
  const [username, setUsername] = useState(savedEvidence?.username || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<GitHubEvidenceResult | null>(
    savedEvidence
      ? {
          username: savedEvidence.username,
          profile_url: `https://github.com/${savedEvidence.username}`,
          avatar_url: `https://github.com/${savedEvidence.username}.png`,
          name: null,
          bio: null,
          public_repos_count: savedEvidence.public_repos_count || 0,
          total_stars: savedEvidence.total_stars || 0,
          languages: savedEvidence.languages || {},
          top_repos: savedEvidence.top_repos || [],
          disclaimer:
            "EVIDENCE NOTICE: Repository-derived skills represent metadata observed in public repositories and open-source commits. They do NOT constitute verified proof of professional proficiency.",
        }
      : null
  );

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetchGitHubEvidenceAction(username.trim());
      if (res.success && res.data) {
        setEvidence(res.data);
      } else {
        setError(res.error || "Failed to fetch GitHub profile.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while communicating with GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!evidence) return;
    setSaving(true);
    setError(null);

    try {
      const res = await saveStudentGitHubEvidenceAction(evidence);
      if (res.success) {
        setSaveSuccess(true);
      } else {
        setError(res.error || "Failed to save GitHub evidence.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save evidence.");
    } finally {
      setSaving(false);
    }
  };

  const sortedLanguages = evidence
    ? Object.entries(evidence.languages).sort(
        (a, b) => b[1].percentage - a[1].percentage
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Disclaimer Notice Banner */}
      <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="font-semibold text-xs tracking-wide uppercase">
          Signal Evidence Notice
        </AlertTitle>
        <AlertDescription className="text-xs">
          Public GitHub repository data provides supplementary skill signals. Languages and commits
          reflect activity in public repositories and do <strong>NOT</strong> constitute verified proof
          of professional proficiency.
        </AlertDescription>
      </Alert>

      {/* Search Input Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Github className="h-5 w-5" /> Inspect GitHub Handle
          </CardTitle>
          <CardDescription>
            Enter a public GitHub username to inspect public repositories, stars, and language footprints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFetch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-mono text-sm">
                github.com/
              </span>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-28 font-mono text-sm"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Repositories...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Extract Signals
                </>
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert className="mt-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>
                GitHub skill evidence successfully attached to your student profile!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results View */}
      {evidence && (
        <div className="space-y-6">
          {/* Header Profile Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {evidence.avatar_url ? (
                    <img
                      src={evidence.avatar_url}
                      alt={evidence.username}
                      className="h-16 w-16 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center font-bold text-xl">
                      {evidence.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">
                        {evidence.name || evidence.username}
                      </h2>
                      <Badge variant="outline" className="font-mono text-xs">
                        @{evidence.username}
                      </Badge>
                    </div>
                    {evidence.bio && (
                      <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                        {evidence.bio}
                      </p>
                    )}
                    <a
                      href={evidence.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs inline-flex items-center gap-1 mt-1"
                    >
                      View GitHub Profile <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="outline"
                    className="w-full sm:w-auto gap-2 text-xs"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Evidence to Profile
                  </Button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border text-center">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {evidence.public_repos_count}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Public Repositories
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 fill-amber-500" />
                    {evidence.total_stars}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Total Stargazers
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-500">
                    {sortedLanguages.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Languages Detected
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {evidence.top_repos.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Top Projects Scored
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" /> Observed Language Distribution
              </CardTitle>
              <CardDescription>
                Proportion of bytes committed across public source repositories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedLanguages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No public programming languages detected in analyzed repositories.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Unified Bar */}
                  <div className="h-3 w-full bg-muted rounded-full flex overflow-hidden">
                    {sortedLanguages.map(([lang, info], idx) => {
                      const colors = [
                        "bg-blue-500",
                        "bg-emerald-500",
                        "bg-amber-500",
                        "bg-purple-500",
                        "bg-rose-500",
                        "bg-indigo-500",
                        "bg-cyan-500",
                      ];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={lang}
                          className={`${color} h-full transition-all`}
                          style={{ width: `${Math.max(info.percentage, 2)}%` }}
                          title={`${lang}: ${info.percentage}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Badges breakdown */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {sortedLanguages.map(([lang, info]) => (
                      <Badge
                        key={lang}
                        variant="secondary"
                        className="text-xs py-1 px-2.5 font-medium flex items-center gap-1.5"
                      >
                        <span className="font-semibold">{lang}</span>
                        <span className="text-muted-foreground font-mono">
                          {info.percentage}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Repositories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Key Public Repositories
              </CardTitle>
              <CardDescription>
                Public open-source repositories sorted by stars and recent activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidence.top_repos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public repositories found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidence.top_repos.map((repo) => (
                    <div
                      key={repo.name}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sm hover:underline text-primary flex items-center gap-1"
                          >
                            {repo.name}
                            <ExternalLink className="h-3 w-3 inline text-muted-foreground" />
                          </a>
                          {repo.primary_language && (
                            <Badge variant="outline" className="text-[11px] font-normal">
                              {repo.primary_language}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {repo.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-3 pt-2 text-xs text-muted-foreground border-t border-border/40">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3.5 w-3.5" />
                          {repo.forks}
                        </span>
                        <span className="ml-auto text-[11px]">
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
