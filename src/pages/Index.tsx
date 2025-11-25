import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Award, Target, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ExpandableText } from "@/components/ExpandableText";
import tutorialClass1 from "@/assets/tutorial-class-1.jpg";
import tutorialClass2 from "@/assets/tutorial-class-2.jpg";
import tutorialClass3 from "@/assets/tutorial-class-3.jpg";
import reviewMarvelous from "@/assets/review-marvelous.jpg";
import reviewBlessing from "@/assets/review-blessing.jpg";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
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
        <section className="py-16 bg-gradient-to-br from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Learning Environment</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
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

        {/* Student Reviews Section */}
        <section className="py-16 bg-gradient-to-br from-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Star className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Student Success Stories</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Hear from our students who achieved excellence
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Marvelous Olaleye Review */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-primary/20">
                      <img 
                        src={reviewMarvelous} 
                        alt="Marvelous Olaleye"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-primary">Marvelous Olaleye</h3>
                    <p className="text-sm text-muted-foreground">200L Radiography Student, FUOYE</p>
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  
                  <blockquote className="italic text-sm text-muted-foreground mb-4 text-center">
                    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today." - Malcolm X
                  </blockquote>
                  
                  <ExpandableText text="Hi there, my name is Olaleye Marvellous, a 200L Radiography Student of this great citadel of learning, Federal University, Oye Ekiti.

Life in 100L as a fresher can be overwhelming as you are just getting to know the environment and also trying to catch up with the academic curriculum. That was how it was for me and so many other students.

I attended Genius Lab Tutorial for the first time and I instantly knew that my journey was going to be aided.

The simplified teachings and words of encouragement always create an ever-present urge for me to pick up my book and read even when I feel lazy at times. I believe this shaped me and helped me attain a GPA of 5.0 and CGPA of 4.82 at the end of 100L session.

As someone that has gone through this phase and passed excellently, I can tell you that everything you wish to achieve is possible.

Pray, study hard and do not take tutorial classes at GeniusLab for granted. The tutors will always do their best to teach you and make you understand in the most simplified way but it's left to you to take them seriously." />
                </CardContent>
              </Card>

              {/* Okpe Blessing Review */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-secondary/20">
                      <img 
                        src={reviewBlessing} 
                        alt="Okpe Ambless Mercy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-secondary">Okpe Ambless Mercy</h3>
                    <p className="text-sm text-muted-foreground">200L Pure & Applied Chemistry, FUOYE</p>
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                      ))}
                    </div>
                  </div>
                  
                  <ExpandableText text="I'm Okpe Ambless Mercy, a 200 Level student, Pure & Applied Chemistry, FUOYE.

During my 100-level year at the Federal University of Oye-Ekiti, I resumed late and missed several important lectures. This affected my understanding of the early topics, and I struggled to keep up with the pace of my courses. However, joining Genius Lab Tutorial became a major turning point in my academic journey.

The tutorial provided a supportive and well-structured learning environment. The tutor was patient, accommodating, and taught in a way that made complex topics simple and easy to understand. Through consistent attendance, I was able to catch up with my classmates, regain confidence, and build a strong academic foundation—especially in chemistry.

Looking back now as a 200-level student, I can clearly see how much Genius Lab Tutorial contributed to my progress. The knowledge I gained there continues to help me till today.

To every student currently attending Genius Lab Tutorial, my sincere advice is to take the classes seriously. The lessons you receive will not only help you now but also prepare you for higher levels. Thank you." />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gradient-to-br from-muted/20 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <BookOpen className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">CBT Practice System</h3>
                  <p className="text-muted-foreground">
                    State-of-the-art Computer-Based Testing system for JAMB/UTME preparation with 
                    realistic exam simulations and instant feedback.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <Users className="h-12 w-12 text-secondary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Expert Tutoring</h3>
                  <p className="text-muted-foreground">
                    Personalized tutorial sessions by experienced educators in Mathematics, 
                    Physics, Chemistry, and university-level courses.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <Award className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2">Proven Track Record</h3>
                  <p className="text-muted-foreground">
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
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
