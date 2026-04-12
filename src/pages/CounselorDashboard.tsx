import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, LogOut, AlertTriangle, TrendingUp, Users, Activity, Reply } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Textarea } from "@/components/ui/textarea";
import { analyzeRisk } from "@/lib/riskScoring";
import { z } from "zod";

const replySchema = z.object({
  message: z.string()
    .trim()
    .min(10, { message: "Reply must be at least 10 characters" })
    .max(2000, { message: "Reply must be less than 2000 characters" })
});

interface Report {
  id: string;
  content: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
}

const CounselorDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Verify user is a counselor from database
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (roleData?.role !== 'counselor') {
        navigate("/student");
        toast({
          title: "Access Denied",
          description: "You need counselor privileges to access this page.",
          variant: "destructive",
        });
        return;
      }
      
      setUser(session.user);
      fetchReports();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      if (event === "SIGNED_IN" && session) {
        // Defer database check to avoid deadlock
        setTimeout(async () => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (roleData?.role !== 'counselor') {
            navigate("/student");
            toast({
              title: "Access Denied",
              description: "You need counselor privileges to access this page.",
              variant: "destructive",
            });
            return;
          }
          
          setUser(session.user);
          fetchReports();
        }, 0);
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } else {
      const processedData = (data || []).map((report: any) => {
        if (!report.priority || report.risk_score === undefined || report.risk_score === null) {
          const { riskScore, priority } = analyzeRisk(report.content);
          supabase.from("reports").update({ priority, risk_score: riskScore }).eq("id", report.id).then();
          return { ...report, priority, risk_score: riskScore };
        }
        return report;
      });

      const getRank = (report: any) => {
        const isResolved = report.status === "resolved";
        const isHigh = report.priority === "high";

        if (!isResolved && isHigh) return 1;
        if (!isResolved && !isHigh) return 2;
        if (isResolved && isHigh) return 3;
        return 4;
      };

      processedData.sort((a, b) => {
        const rankA = getRank(a);
        const rankB = getRank(b);

        if (rankA !== rankB) return rankA - rankB;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setReports(processedData as Report[]);
    }
    setLoading(false);
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", reportId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update report status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: "Report status has been updated successfully.",
      });
      fetchReports();
    }
  };

  const handleSendReply = async (report: Report) => {
    if (!user) return;

    const validation = replySchema.safeParse({ message: replyMessage });
    
    if (!validation.success) {
      toast({
        title: "Invalid reply",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setSendingReply(true);

    const { error } = await supabase
      .from("counselor_responses")
      .insert({
        student_id: report.user_id,
        counselor_id: user.id,
        message: validation.data.message
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reply sent",
        description: "Your message has been sent to the student.",
      });
      setReplyMessage("");
      setReplyingTo(null);
    }

    setSendingReply(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="bg-card/80 border-b border-border px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">NovaMind</h1>
              <p className="text-xs text-muted-foreground">Counselor Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Counselor Portal</h2>
            <p className="text-muted-foreground">Monitor student wellbeing and respond to alerts.</p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-gradient-card shadow-card">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <span className="text-2xl font-bold">
                  {reports.filter(r => r.priority === "high").length}
                </span>
              </div>
              <h3 className="font-semibold text-sm">High Priority</h3>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-secondary" />
                <span className="text-2xl font-bold">
                  {reports.filter(r => r.status === "pending").length}
                </span>
              </div>
              <h3 className="font-semibold text-sm">Pending Reports</h3>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">{reports.length}</span>
              </div>
              <h3 className="font-semibold text-sm">Total Reports</h3>
              <p className="text-xs text-muted-foreground mt-1">All submissions</p>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-accent" />
                <span className="text-2xl font-bold">
                  {reports.filter(r => r.status === "resolved").length}
                </span>
              </div>
              <h3 className="font-semibold text-sm">Resolved</h3>
              <p className="text-xs text-muted-foreground mt-1">Cases handled</p>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card className="p-8 bg-gradient-card shadow-glow mb-8 animate-slide-up">
            <h3 className="text-2xl font-bold mb-6">Recent Reports</h3>
            {loading ? (
              <p className="text-muted-foreground">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-muted-foreground">No reports yet.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border border-border rounded-xl hover:shadow-card transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          report.priority === "high" ? "bg-destructive" :
                          report.priority === "medium" ? "bg-secondary" :
                          "bg-muted"
                        } animate-pulse`} />
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          report.status === "pending" ? "bg-secondary/20 text-secondary" :
                          report.status === "in_progress" ? "bg-primary/20 text-primary" :
                          "bg-accent/20 text-accent"
                        }`}>
                          {report.status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          report.priority === "high" 
                            ? "bg-destructive/10 text-destructive border-destructive/20 font-semibold" 
                            : "bg-muted text-muted-foreground border-transparent"
                        }`}>
                          {report.priority === "high" ? "High Priority" : "Normal"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mb-3 ml-6">{report.content}</p>
                    
                    {replyingTo === report.id ? (
                      <div className="ml-6 space-y-3 mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                        <Textarea
                          placeholder="Write your reply to the student... (10-2000 characters)"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="min-h-[100px]"
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{replyMessage.length}/2000 characters</span>
                          <span>Minimum 10 characters required</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleSendReply(report)}
                            disabled={sendingReply}
                          >
                            {sendingReply ? "Sending..." : "Send Reply"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyMessage("");
                            }}
                            disabled={sendingReply}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 ml-6">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setReplyingTo(report.id)}
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          Reply to Student
                        </Button>
                        {report.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, "in_progress")}
                          >
                            Start Review
                          </Button>
                        )}
                        {report.status === "in_progress" && (
                          <Button 
                            size="sm" 
                            onClick={() => updateReportStatus(report.id, "resolved")}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info Card */}
          <Card className="p-8 bg-gradient-card shadow-card">
            <h3 className="text-2xl font-bold mb-4">Support Resources</h3>
            <p className="text-muted-foreground mb-4">
              Monitor student wellbeing through anonymous reports and mood check-ins.
              All student identities are protected while ensuring timely support.
            </p>
            <div className="p-4 bg-primary/5 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong>Privacy Notice:</strong> All reports are anonymized. Focus on content patterns
                and trends to provide better campus-wide support.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CounselorDashboard;
