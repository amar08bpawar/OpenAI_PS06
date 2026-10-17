"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  GraduationCap,
  Award,
  ChevronDown,
  Loader2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { updateApplicationStatus } from "@/app/actions/applications";
import type { ApplicationStatus } from "@/types/database";

export interface ApplicantRowData {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  course?: string;
  qualification?: string;
  cgpa?: number;
  skills?: string[];
  listingId: string;
  listingTitle: string;
  listingType: "job" | "internship";
  status: ApplicationStatus;
  appliedAt: string;
  notes?: string;
}

interface RecruiterApplicationManagerProps {
  initialApplications: ApplicantRowData[];
  filterShortlistedOnly?: boolean;
}

const ALL_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
  "Withdrawn",
];

export function RecruiterApplicationManager({
  initialApplications,
  filterShortlistedOnly = false,
}: RecruiterApplicationManagerProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicantRowData[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    filterShortlistedOnly ? "All Pipeline" : "All"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdatingId(applicationId);
    setActionMessage(null);

    try {
      const res = await updateApplicationStatus({
        applicationId,
        newStatus,
      });

      if (!res.success) {
        setActionMessage({
          id: applicationId,
          type: "error",
          text: res.error || "Failed to update status",
        });
      } else {
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
        );
        setActionMessage({
          id: applicationId,
          type: "success",
          text: `Status updated to ${newStatus}`,
        });
        router.refresh();
      }
    } catch (err: any) {
      setActionMessage({
        id: applicationId,
        type: "error",
        text: err?.message || "Error updating candidate status",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    // Pipeline filter
    if (filterShortlistedOnly) {
      const isPipeline =
        app.status === "Shortlisted" || app.status === "Interview" || app.status === "Selected";
      if (!isPipeline) return false;
      if (selectedStatus !== "All Pipeline" && app.status !== selectedStatus) {
        return false;
      }
    } else {
      if (selectedStatus !== "All" && app.status !== selectedStatus) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = app.studentName.toLowerCase().includes(query);
      const matchEmail = app.studentEmail.toLowerCase().includes(query);
      const matchTitle = app.listingTitle.toLowerCase().includes(query);
      const matchSkill = app.skills?.some((s) => s.toLowerCase().includes(query));
      return matchName || matchEmail || matchTitle || matchSkill;
    }

    return true;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Selected":
        return <Badge variant="success">Selected</Badge>;
      case "Shortlisted":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Shortlisted</Badge>;
      case "Interview":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Interview</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "Withdrawn":
        return <Badge variant="outline" className="text-muted-foreground">Withdrawn</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">Applied</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, email, role, or skill..."
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterShortlistedOnly ? (
            <>
              {["All Pipeline", "Shortlisted", "Interview", "Selected"].map((st) => (
                <Button
                  key={st}
                  variant={selectedStatus === st ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 whitespace-nowrap"
                  onClick={() => setSelectedStatus(st)}
                >
                  {st}
                </Button>
              ))}
            </>
          ) : (
            <>
              {["All", "Applied", "Shortlisted", "Interview", "Selected", "Rejected"].map((st) => (
                <Button
                  key={st}
                  variant={selectedStatus === st ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 whitespace-nowrap"
                  onClick={() => setSelectedStatus(st)}
                >
                  {st}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No candidate applications found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || selectedStatus !== "All"
                  ? "Try adjusting your search criteria or status filter."
                  : "When students apply to your postings, candidate dossiers will appear here."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isUpdating = updatingId === app.id;
            const msg = actionMessage?.id === app.id ? actionMessage : null;

            return (
              <Card
                key={app.id}
                className="border-border/80 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student & Role Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-foreground truncate">
                        {app.studentName}
                      </h3>
                      {getStatusBadge(app.status)}
                      <span className="text-xs text-muted-foreground">&bull;</span>
                      <span className="text-xs text-muted-foreground">
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground flex items-center">
                        <Briefcase className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
                        {app.listingTitle} ({app.listingType === "job" ? "Full-Time" : "Internship"})
                      </span>
                      <span>{app.studentEmail}</span>
                      {app.cgpa !== undefined && (
                        <span className="font-semibold text-foreground">
                          CGPA: {app.cgpa.toFixed(2)}
                        </span>
                      )}
                      {app.qualification && (
                        <span>{app.qualification}</span>
                      )}
                      {app.course && (
                        <span className="truncate max-w-[200px]">{app.course}</span>
                      )}
                    </div>

                    {app.skills && app.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {app.skills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-secondary-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                        {app.skills.length > 6 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{app.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    )}

                    {app.notes && (
                      <p className="text-xs bg-muted/50 p-2.5 rounded-lg text-muted-foreground italic border border-border/50">
                        &quot;{app.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions & Status Workflow Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:border-l lg:border-border/60 lg:pl-4">
                    {app.status === "Applied" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, "Shortlisted")}
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, "Rejected")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {app.status === "Shortlisted" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/30"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, "Interview")}
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
                          Schedule Interview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, "Rejected")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {app.status === "Interview" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, "Selected")}
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
                          Select Candidate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, "Rejected")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {app.status === "Selected" && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Offer Extended
                      </span>
                    )}

                    {app.status === "Rejected" && (
                      <span className="text-xs font-medium text-rose-500 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Application Closed
                      </span>
                    )}

                    {app.status === "Withdrawn" && (
                      <span className="text-xs text-muted-foreground italic">
                        Withdrawn by candidate
                      </span>
                    )}
                  </div>
                </div>

                {msg && (
                  <div
                    className={`px-4 py-1.5 text-xs font-medium border-t ${
                      msg.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
