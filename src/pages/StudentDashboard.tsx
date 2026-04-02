import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, LogOut, MessageSquare, FileText, Heart, Mail } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import AIChat from "@/components/AIChat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";

const reportSchema = z.object({
  content: z.string()
    .trim()
    .min(10, { message: "Report must be at least 10 characters" })
    .max(5000, { message: "Report must be less than 5000 characters" })
});

const moodNoteSchema = z.object({
  note: z.string()
    .trim()
    .max(500, { message: "Note must be less than 500 characters" })
    .optional()
});

interface CounselorResponse {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const StudentDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [responses, setResponses] = useState<CounselorResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchResponses(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchResponses(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscription for new counselor responses
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('counselor-responses-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'counselor_responses',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          fetchResponses(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchResponses = async (userId: string) => {
    const { data, error } = await supabase
      .from("counselor_responses")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setResponses(data);
      setUnreadCount(data.filter(r => !r.is_read).length);
    }
  };

  const markAsRead = async (responseId: string) => {
    await supabase
      .from("counselor_responses")
      .update({ is_read: true })
      .eq("id", responseId);
    
    if (user) {
      fetchResponses(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const handleSubmitReport = async () => {
    if (!user) return;

    // Validate input
    const validation = reportSchema.safeParse({ content: report });
    
    if (!validation.success) {
      toast({
        title: "Invalid report",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        content: validation.data.content,
        status: "pending",
        priority: "normal"
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    toast({
      title: "Report submitted",
      description: "Your report has been received. A counselor will review it soon.",
    });
    
    setReport("");
    setLoading(false);
  };

  const handleMoodSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Select a mood",
        description: "Please select how you're feeling.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    // Validate note if provided
    if (moodNote.trim()) {
      const validation = moodNoteSchema.safeParse({ note: moodNote });
      if (!validation.success) {
        toast({
          title: "Invalid note",
          description: validation.error.issues[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    const { error } = await supabase
      .from("mood_checkins")
      .insert({
        user_id: user.id,
        mood: selectedMood,
        note: moodNote.trim() || null
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save mood check-in. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Mood recorded",
      description: "Thank you for sharing how you're feeling.",
    });

    setShowMoodDialog(false);
    setSelectedMood("");
    setMoodNote("");
    setLoading(false);
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
              <p className="text-xs text-muted-foreground">Student Portal</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">We're here to listen and support you.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card 
              className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => setShowAIChat(true)}
            >
              <MessageSquare className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">Chat with AI</h3>
              <p className="text-sm text-muted-foreground">Get instant emotional support</p>
            </Card>

            <Card 
              className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => reportRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <FileText className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-bold mb-2">Anonymous Report</h3>
              <p className="text-sm text-muted-foreground">Share your concerns safely</p>
            </Card>

            <Card 
              className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => setShowMoodDialog(true)}
            >
              <Heart className="w-8 h-8 text-accent mb-3" />
              <h3 className="font-bold mb-2">Mood Check-in</h3>
              <p className="text-sm text-muted-foreground">Track your wellbeing</p>
            </Card>

            <Card 
              className="p-6 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
              onClick={() => setShowResponsesDialog(true)}
            >
              <Mail className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-bold mb-2">Counselor Responses</h3>
              <p className="text-sm text-muted-foreground">View messages from staff</p>
              {unreadCount > 0 && (
                <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {unreadCount}
                </div>
              )}
            </Card>
          </div>

          <Card ref={reportRef} className="p-8 bg-gradient-card shadow-glow animate-slide-up">
            <h3 className="text-2xl font-bold mb-4">Submit Anonymous Report</h3>
            <p className="text-muted-foreground mb-6">
              Your identity is protected. Share what's on your mind, and we'll make sure a counselor reviews your report.
            </p>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Tell us what's happening... You're safe here. (Minimum 10 characters)"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                className="min-h-[200px]"
                maxLength={5000}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{report.length}/5000 characters</span>
                <span>Minimum 10 characters required</span>
              </div>
              <Button onClick={handleSubmitReport} disabled={loading} className="w-full">
                {loading ? "Submitting..." : "Submit Report to Counselor"}
              </Button>
            </div>
          </Card>

          <div className="mt-8 p-6 bg-primary/5 rounded-2xl">
            <p className="text-sm text-center text-muted-foreground">
              <strong>Crisis Support:</strong> If you're in immediate danger, please contact emergency services or your campus security right away.
            </p>
          </div>
        </div>
      </main>

      {/* AI Chat Modal */}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}

      {/* Mood Check-in Dialog */}
      <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>How are you feeling today?</DialogTitle>
            <DialogDescription>
              Taking a moment to check in with yourself can help track your wellbeing over time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: "😊", label: "Great", value: "great" },
                { emoji: "🙂", label: "Good", value: "good" },
                { emoji: "😐", label: "Okay", value: "okay" },
                { emoji: "😔", label: "Not great", value: "not_great" },
                { emoji: "😢", label: "Struggling", value: "struggling" },
                { emoji: "😰", label: "Crisis", value: "crisis" }
              ].map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedMood === mood.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Add a note (optional, max 500 characters)"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              className="min-h-[80px]"
              maxLength={500}
            />
            {moodNote && (
              <p className="text-xs text-muted-foreground text-right">
                {moodNote.length}/500 characters
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowMoodDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleMoodSubmit} disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Responses Dialog */}
      <Dialog open={showResponsesDialog} onOpenChange={setShowResponsesDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Messages from Counselors</DialogTitle>
            <DialogDescription>
              Read messages and responses from your counselors and administrators.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[400px]">
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see responses from counselors here
                </p>
              </div>
            ) : (
              responses.map((response) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    response.is_read
                      ? "border-border bg-card"
                      : "border-primary/50 bg-primary/5"
                  }`}
                  onClick={() => !response.is_read && markAsRead(response.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(response.created_at).toLocaleDateString()} at{" "}
                        {new Date(response.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {!response.is_read && (
                      <span className="text-xs font-bold text-primary">NEW</span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                </div>
              ))
            )}
          </div>
          <Button onClick={() => setShowResponsesDialog(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
