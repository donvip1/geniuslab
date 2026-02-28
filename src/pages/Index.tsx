import { useState, useEffect, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Award, Target, Star, Zap, GraduationCap, ChevronRight, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { AdvertisementPopup } from "@/components/AdvertisementPopup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import tutorialClass1 from "@/assets/tutorial-class-1.jpg";
import tutorialClass2 from "@/assets/tutorial-class-2.jpg";
import tutorialClass3 from "@/assets/tutorial-class-3.jpg";
import gecLogo from "@/assets/gec-logo-transparent.png";

// Counter animation hook
const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count, ref };
};

const Index = () => {
  const [showJambPopup, setShowJambPopup] = useState(false);
  const navigate = useNavigate();

  const heroCarouselPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  const stat1 = useCountUp(500, 2000);
  const stat2 = useCountUp(95, 2000);
  const stat3 = useCountUp(50, 2000);
  const stat4 = useCountUp(300, 2000);

  useEffect(() => {
    if (sessionStorage.getItem("jamb2026PopupShown")) return;
    const timer = setTimeout(() => {
      setShowJambPopup(true);
      sessionStorage.setItem("jamb2026PopupShown", "true");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const examAlerts = [
    { text: "🎯 JAMB 2026 Practice Exams Now Live!", link: "/exam", active: true },
    { text: "📚 University CBT Exams Available", link: "/exam", active: true },
    { text: "🔥 WAEC/NECO Past Questions Ready", link: "/exam", active: true },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEOHead
        title="GeniusLab – Free JAMB CBT Practice, WAEC, NECO & University Past Questions 2025"
        description="Practice 20,000+ JAMB UTME, WAEC, NECO past questions with answers & explanations. Free CBT mock exams. University departmental exam prep. Start now!"
        canonical="https://geniuslabz.xyz/"
        keywords="JAMB CBT practice, JAMB past questions 2025, WAEC past questions, NECO, NABTEB, university exams, CBT practice Nigeria, JAMB mock exam, free JAMB app"
      />
      <Navbar />
      <AdvertisementPopup />

      <Dialog open={showJambPopup} onOpenChange={setShowJambPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎯 JAMB 2026</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Prepare for JAMB 2026: Practice Exams Are Now Available — Participate Now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={() => { setShowJambPopup(false); navigate("/exam"); }}>
              Participate Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <main className="flex-1 pt-16">
        {/* Blinking Exam Alert Banner */}
        <div className="bg-accent/10 border-b border-accent/20 overflow-hidden">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {examAlerts.map((alert, i) => (
                <Link
                  key={i}
                  to={alert.link}
                  className="animate-blink-glow flex-shrink-0 inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-1.5 rounded-full text-sm font-semibold border border-accent/30 hover:bg-accent/30 transition-colors"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  {alert.text}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Section with Image Carousel Background */}
        <section className="relative overflow-hidden min-h-[80vh] md:min-h-[85vh] flex items-center">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary">
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[heroCarouselPlugin.current]}
              className="absolute inset-0"
            >
              <CarouselContent className="h-full -ml-0">
                {[tutorialClass1, tutorialClass2, tutorialClass3].map((img, i) => (
                  <CarouselItem key={i} className="pl-0 basis-full">
                    <div className="h-[85vh] w-full relative">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-secondary/80" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Floating decorative elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-float" />
            <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary-foreground/10 rounded-full blur-lg animate-float" style={{ animationDelay: "2s" }} />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center text-primary-foreground space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium animate-fade-in">
                <Sparkles className="h-4 w-4 text-accent" />
                Nigeria's #1 Student Success Platform
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight animate-fade-in">
                Welcome to{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent animate-shimmer">
                    GeniusLab
                  </span>
                </span>
              </h1>
              
              <p className="text-lg md:text-2xl opacity-90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Where Learning Meets Excellence — Your Success, Our Mission
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Link to="/exam">
                  <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8 py-6">
                    <Zap className="h-5 w-5 mr-2" />
                    Start Practice Exam
                  </Button>
                </Link>
                <a href="https://wa.me/2348124269495" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8 py-6">
                    Join Our Tutorial
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="py-12 md:py-16 bg-background relative -mt-8 md:-mt-12 z-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { ref: stat1.ref, count: stat1.count, suffix: "+", label: "Students Trained", icon: Users, color: "text-primary" },
                { ref: stat2.ref, count: stat2.count, suffix: "%", label: "Pass Rate", icon: TrendingUp, color: "text-secondary" },
                { ref: stat3.ref, count: stat3.count, suffix: "+", label: "Expert Tutors", icon: GraduationCap, color: "text-accent" },
                { ref: stat4.ref, count: stat4.count, suffix: "+", label: "JAMB Score", icon: Award, color: "text-primary" },
              ].map((stat, i) => (
                <div key={i} ref={stat.ref}>
                  <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-t-4 border-t-primary/20">
                    <CardContent className="pt-6 pb-4 flex flex-col items-center text-center gap-2">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      <span className={`text-3xl md:text-4xl font-extrabold ${stat.color}`}>
                        {stat.count}{stat.suffix}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Available Exams - Blinking Cards */}
        <section className="py-16 bg-gradient-to-br from-muted/50 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Exams</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose your exam category and start practicing now
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { name: "JAMB UTME", desc: "Practice & Mock Exams", icon: "🎯", badge: "LIVE", link: "/exam" },
                { name: "University CBT", desc: "Departmental Exams", icon: "🎓", badge: "AVAILABLE", link: "/exam" },
                { name: "WAEC", desc: "Past Questions", icon: "📝", badge: "READY", link: "/exam" },
                { name: "NECO/NABTEB", desc: "Past Questions", icon: "📚", badge: "READY", link: "/exam" },
              ].map((exam, i) => (
                <Link key={i} to={exam.link}>
                  <Card className="group shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer border-2 hover:border-primary/40 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <span className="animate-blink-glow inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-foreground">
                        {exam.badge}
                      </span>
                    </div>
                    <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-3">
                      <span className="text-4xl group-hover:scale-110 transition-transform inline-block">{exam.icon}</span>
                      <h3 className="text-lg font-bold">{exam.name}</h3>
                      <p className="text-sm text-muted-foreground">{exam.desc}</p>
                      <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Environment Gallery */}
        <section className="py-16 bg-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-background">Our Learning Environment</h2>
              <p className="text-background/70 max-w-2xl mx-auto">
                See our students in action — from interactive tutorials to focused exam preparation
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { img: tutorialClass1, title: "Interactive Tutorial Sessions" },
                { img: tutorialClass2, title: "Modern CBT Practice Center" },
                { img: tutorialClass3, title: "Collaborative Learning" },
              ].map((item, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                  <img 
                    src={item.img} 
                    alt={item.title}
                    className="w-full h-64 md:h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                    <p className="text-background font-bold text-lg">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision with Animation */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To raise a new generation of students who learn with confidence, think with clarity, 
                    and perform with excellence at every level of their academic journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-l-4 border-l-secondary">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Award className="h-8 w-8 text-secondary" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Vision</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the most trusted educational support system in FUOYE by consistently 
                    delivering life-changing academic results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Student Reviews Carousel */}
        <section className="py-20 bg-secondary overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block p-4 rounded-full bg-secondary-foreground/10 mb-4 animate-float">
                <Star className="h-16 w-16 text-secondary-foreground" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary-foreground">
                Student Success Stories
              </h2>
              <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
                Hear from our students who transformed their academic journey
              </p>
            </div>
            <TestimonialsCarousel />
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">What We Offer</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: BookOpen, color: "text-secondary", title: "CBT Practice System", desc: "State-of-the-art Computer-Based Testing system for JAMB/UTME preparation with realistic exam simulations and instant feedback." },
                { icon: Users, color: "text-accent", title: "Expert Tutoring", desc: "Personalized tutorial sessions by experienced educators in Mathematics, Physics, Chemistry, and university-level courses." },
                { icon: Award, color: "text-secondary", title: "Proven Track Record", desc: "Our students consistently achieve JAMB scores of 300+, WAEC distinctions, and maintain excellent GPAs at top universities." },
              ].map((item, i) => (
                <Card key={i} className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 bg-primary-foreground/10 border-primary-foreground/20 group">
                  <CardContent className="pt-6">
                    <item.icon className={`h-12 w-12 ${item.color} mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-xl font-bold mb-2 text-primary-foreground">{item.title}</h3>
                    <p className="text-primary-foreground/80">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-secondary via-accent to-primary text-primary-foreground relative overflow-hidden">
          {/* Animated background shapes */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-40 h-40 bg-primary-foreground/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary-foreground/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Ready to Excel?</h2>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of successful students today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/exam">
                <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8 py-6">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Practicing Now
                </Button>
              </Link>
              <a href="https://wa.me/2348124269495" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8 py-6">
                  Join Our Tutorial
                </Button>
              </a>
            </div>
          </div>
        </section>
        {/* SEO FAQ Section - crawlable by search engines */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "Where can I practice JAMB CBT past questions for free?", a: "GeniusLab offers 20,000+ free JAMB CBT past questions from 2001 to 2025 with detailed answers and explanations. Practice Use of English, Mathematics, Physics, Chemistry, Biology, Government, Economics, Literature, and many more subjects." },
                { q: "How can I get WAEC past questions and answers?", a: "GeniusLab provides thousands of WAEC SSCE past questions with correct answers and step-by-step explanations across all subjects. Practice online for free and prepare for your WAEC examination." },
                { q: "What is the JAMB marking scheme?", a: "Each correct answer in JAMB UTME is worth 2.5 marks. The exam has 4 subjects: Use of English (60 questions) and 3 other subjects (40 questions each), giving a maximum score of 400. GeniusLab's mock exams use this exact marking scheme." },
                { q: "Can I practice NECO and NABTEB past questions online?", a: "Yes! GeniusLab has comprehensive NECO and NABTEB past questions with answers for all subjects. Practice in CBT format to simulate the real exam experience." },
                { q: "How do I prepare for university departmental exams?", a: "GeniusLab offers past questions for university departmental exams including 100-level, 200-level courses and above across various departments. Access both 1st and 2nd semester exams." },
                { q: "Where can I find summaries for JAMB literature texts?", a: "GeniusLab provides study materials including summaries, themes, and character analysis for recommended JAMB literature texts. Access comprehensive study guides at geniuslabz.xyz." },
              ].map((faq, i) => (
                <details key={i} className="group bg-card rounded-lg border p-4 cursor-pointer">
                  <summary className="font-semibold text-base list-none flex items-center justify-between">
                    <span>{faq.q}</span>
                    <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90 text-muted-foreground" />
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
