import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Award, Target, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { AdvertisementPopup } from "@/components/AdvertisementPopup";
import tutorialClass1 from "@/assets/tutorial-class-1.jpg";
import tutorialClass2 from "@/assets/tutorial-class-2.jpg";
import tutorialClass3 from "@/assets/tutorial-class-3.jpg";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AdvertisementPopup />
      
      {/* Hero Section */}
      <main className="flex-1 pt-16">
        <section className="relative bg-gradient-to-br from-primary via-secondary to-accent py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-primary-foreground">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                Welcome to GeniusLab Educational Consult
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                Where Learning Meets Excellence - Your Success, Our Mission
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <Link to="/exam">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-lg hover:shadow-xl">
                    Start Practice Exam
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-background/10 hover:bg-background/20 border-primary-foreground/20">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Educational Images Gallery */}
        <section className="py-16 bg-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-background">Our Learning Environment</h2>
              <p className="text-background/70 max-w-2xl mx-auto">
                See our students in action - from interactive tutorials to focused exam preparation
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all">
                <img 
                  src={tutorialClass1} 
                  alt="Nigerian students in tutorial class with teacher" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold">Interactive Tutorial Sessions</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all">
                <img 
                  src={tutorialClass2} 
                  alt="Students taking computer-based test in modern CBT center" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold">Modern CBT Practice Center</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all">
                <img 
                  src={tutorialClass3} 
                  alt="Students collaborating in group study session" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold">Collaborative Learning Environment</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-primary" />
                    <h2 className="text-2xl font-bold">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To raise a new generation of students who learn with confidence, think with clarity, 
                    and perform with excellence at every level of their academic journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8 text-secondary" />
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

        {/* Student Reviews Carousel Section */}
        <section className="py-20 bg-secondary overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-block p-4 rounded-full bg-secondary-foreground/10 mb-4">
                <Star className="h-16 w-16 text-secondary-foreground" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-secondary-foreground">
                Student Success Stories
              </h2>
              <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
                Hear from our students who transformed their academic journey and achieved excellence
              </p>
            </div>
            
            <TestimonialsCarousel />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">What We Offer</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="pt-6">
                  <BookOpen className="h-12 w-12 text-secondary mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-primary-foreground">CBT Practice System</h3>
                  <p className="text-primary-foreground/80">
                    State-of-the-art Computer-Based Testing system for JAMB/UTME preparation with 
                    realistic exam simulations and instant feedback.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="pt-6">
                  <Users className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-primary-foreground">Expert Tutoring</h3>
                  <p className="text-primary-foreground/80">
                    Personalized tutorial sessions by experienced educators in Mathematics, 
                    Physics, Chemistry, and university-level courses.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="pt-6">
                  <Award className="h-12 w-12 text-secondary mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-primary-foreground">Proven Track Record</h3>
                  <p className="text-primary-foreground/80">
                    Our students consistently achieve JAMB scores of 300+, WAEC distinctions, 
                    and maintain excellent GPAs at top universities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-secondary via-accent to-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Excel?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of successful students today
            </p>
            <a href="https://wa.me/2348124269495" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
                Join Our Tutorial
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
