import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Shield, MessageSquare, BarChart3, Heart, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-60" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in text-foreground">
            No student should suffer in silence.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto animate-slide-up">
            AI that listens between the lines to protect students from bullying and distress.
          </p>
          <div className="flex gap-4 justify-center animate-scale-in">
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Powered by Empathy & Intelligence
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-8 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Emotion AI Detection</h3>
              <p className="text-muted-foreground">
                Advanced NLP analyzes text and mood patterns to identify distress signals early.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Anonymous Reports</h3>
              <p className="text-muted-foreground">
                Students can share their concerns safely without fear of exposure.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Counselor Dashboard</h3>
              <p className="text-muted-foreground">
                Real-time risk insights and trends while protecting student identities.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Support Bot</h3>
              <p className="text-muted-foreground">
                24/7 emotional guidance and self-help resources powered by compassionate AI.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Technology That Cares
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              NovaMind uses cutting-edge Natural Language Processing and Emotion Recognition AI to understand the nuances of student communication—adapting to local languages, slang, and cultural contexts.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="p-6">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Secure</h3>
                <p className="text-muted-foreground">End-to-end encryption protects every conversation</p>
              </div>
              <div className="p-6">
                <Lock className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Anonymous</h3>
                <p className="text-muted-foreground">Complete privacy for students seeking help</p>
              </div>
              <div className="p-6">
                <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Scalable</h3>
                <p className="text-muted-foreground">Grows with your institution's needs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Our Mission
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            We believe that <span className="text-primary font-semibold">technology with empathy can save lives</span>. Every school and university should be emotionally intelligent—a place where students feel heard, supported, and safe.
          </p>
          <p className="text-xl text-muted-foreground mb-12">
            NovaMind is more than software. It's a commitment to student wellbeing, powered by AI that truly understands.
          </p>
          <Button asChild size="lg" className="shadow-glow">
            <Link to="/auth">Join the Movement</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 border-t border-border py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">NovaMind</h3>
              <p className="text-muted-foreground">Emotional safety, powered by AI</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Join Beta Program</a>
            </div>
          </div>
          <div className="text-center mt-8 text-muted-foreground text-sm">
            © 2025 NovaMind. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
