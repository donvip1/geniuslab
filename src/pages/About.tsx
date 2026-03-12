import { useState, useEffect } from "react";
import { AdBannerSmart, AdInArticleSmart } from "@/components/SubscriptionAwareAd";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, TrendingUp, BookOpen, Award, Loader2 } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import { supabase } from "@/integrations/supabase/client";
import holysinnerProfile from "@/assets/holysinner-profile.jpg";
import colossusProfile from "@/assets/colossus-profile.jpg";
import greenarrowProfile from "@/assets/greenarrow-profile.jpg";
import mathleteProfile from "@/assets/mathlete-profile.jpg";
import sonofgodProfile from "@/assets/sonofgod-profile.jpg";
import mrwealthProfile from "@/assets/mrwealth-profile.jpg";
import donvipProfile from "@/assets/donvip-profile.jpg";

interface TeamExpert {
  id: string;
  name: string;
  alias: string | null;
  title: string;
  description: string;
  image_url: string | null;
  display_order: number;
}

// Map aliases to local images as fallback
const aliasImageMap: { [key: string]: string } = {
  "Colossus": colossusProfile,
  "Green Arrow": greenarrowProfile,
  "Mathlete": mathleteProfile,
  "Son of God": sonofgodProfile,
};

const About = () => {
  const [experts, setExperts] = useState<TeamExpert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const { data, error } = await supabase
          .from("team_experts")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        setExperts(data || []);
      } catch (error) {
        console.error("Error fetching team experts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

  const getExpertImage = (expert: TeamExpert) => {
    if (expert.image_url) return expert.image_url;
    if (expert.alias && aliasImageMap[expert.alias]) return aliasImageMap[expert.alias];
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About GeniusLab</h1>
              <p className="text-lg opacity-90">
                Where Learning Meets Excellence. Your Success, Our Mission.
              </p>
            </div>
          </div>
        </section>

        {/* Official Profile */}
        <section className="py-16 bg-gradient-to-br from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardContent className="pt-8">
                  <h2 className="text-3xl font-bold mb-6 text-center">GeniusLab Educational Consult — Official Profile</h2>
                  <ExpandableText text="GeniusLab Educational Consult is a leading academic support hub built on a single belief: every student can excel when learning is simplified, structured, and delivered with mastery. At GeniusLab, we transform fear into confidence, confusion into clarity, and average performance into outstanding results through a unique blend of expert tutoring, mentorship, and problem-solving techniques tailored for today's learners.

We are not just a tutorial center, we are an excellence factory." />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Co-Founders Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Award className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Our Co-Founders</h2>
              </div>
              
              <div className="space-y-8">
                {/* Etim Nsisong Enefiok */}
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-primary/20">
                        <img 
                          src={holysinnerProfile} 
                          alt="Etim Nsisong Enefiok (Holysinner)"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-primary text-center">Etim Nsisong Enefiok</h3>
                      <p className="text-base font-semibold text-primary/70 text-center mb-2">(Holysinner)</p>
                      <p className="text-sm text-muted-foreground font-medium text-center">Co-Founder & Lead Tutor</p>
                    </div>
                    <ExpandableText text="Etim Nsisong Enefiok, is a distinguished tutor and rising scholar from the Department of Mathematics, Federal University Oye-Ekiti (FUOYE). Born with an innate passion for teaching and intellectual exploration, he has grown into one of the most influential young educators within his academic community." />
                  </CardContent>
                </Card>

                {/* Robinson Nwankwuda */}
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-secondary/20">
                        <img 
                          src={mrwealthProfile} 
                          alt="Robinson Nwankwuda (Mr. Wealth)"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-secondary text-center">Robinson Nwankwuda</h3>
                      <p className="text-base font-semibold text-secondary/70 text-center mb-2">(Mr. Wealth)</p>
                      <p className="text-sm text-muted-foreground font-medium text-center">Co-Founder</p>
                    </div>
                    <ExpandableText text="Product Strategist, Blockchain Contributor, and Software Quality Specialist, actively involved in emerging technologies, driving innovation, and shaping strategic product development." />
                  </CardContent>
                </Card>

                {/* Philip Awazie */}
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 border-accent/20">
                        <img 
                          src={donvipProfile} 
                          alt="Philip Awazie (Donvip)"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-accent text-center">Philip Awazie</h3>
                      <p className="text-base font-semibold text-accent/70 text-center mb-2">(Donvip)</p>
                      <p className="text-sm text-muted-foreground font-medium text-center">Co-Founder</p>
                    </div>
                    <ExpandableText text="Full-stack Web and App Developer, Web Instructor, Blockchain Contributor, and Graphic Designer — passionate about building scalable digital solutions and delivering impactful tech-driven results." />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Our Identity */}
        <section className="py-16 bg-gradient-to-br from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Identity</h2>
              </div>

              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <ExpandableText text="GeniusLab Educational Consult is powered by a team of exceptional tutors who combine deep academic expertise, proven teaching experience, and a passion for raising academically sound, emotionally confident, and mentally prepared students across FUOYE and Nigeria at large.

Our learning model goes beyond teaching; we create an environment where students understand why concepts work, not just how to memorize them. This is what sets us apart." />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Team of Experts */}
        <section className="py-16 bg-gradient-to-br from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">Our Team of Experts</h2>
                <p className="text-muted-foreground">
                  Meet the masterminds behind academic excellence
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-8">
                  {experts.map((expert, index) => {
                    const image = getExpertImage(expert);
                    const colors = [
                      { border: "border-primary/20", name: "text-primary", title: "text-secondary" },
                      { border: "border-secondary/20", name: "text-secondary", title: "text-accent" },
                      { border: "border-accent/20", name: "text-accent", title: "text-primary" },
                    ];
                    const colorSet = colors[index % colors.length];
                    
                    return (
                      <Card key={expert.id} className="shadow-lg overflow-hidden">
                        <CardContent className="pt-8">
                          <div className="flex flex-col items-center mb-6">
                            {image && (
                              <div className={`w-48 h-48 rounded-full overflow-hidden mb-4 shadow-xl border-4 ${colorSet.border}`}>
                                <img 
                                  src={image} 
                                  alt={expert.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {expert.alias && (
                              <h3 className={`text-2xl font-bold ${colorSet.name} mb-1 text-center`}>
                                {expert.alias.toUpperCase()}
                              </h3>
                            )}
                            <p className={`text-lg font-semibold ${colorSet.title} mb-2 text-center`}>{expert.title}</p>
                            <p className="text-sm text-muted-foreground text-center">{expert.name}</p>
                          </div>
                          
                          <ExpandableText text={expert.description} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* The GeniusLab Advantage */}
        <section className="py-16 bg-gradient-to-br from-background to-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <TrendingUp className="h-16 w-16 text-secondary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">The GeniusLab Advantage</h2>
                <p className="text-muted-foreground">What makes us different</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <BookOpen className="h-10 w-10 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Expert Tutors Only</h3>
                    <p className="text-muted-foreground">
                      Our tutors are not just knowledgeable, they are specialists with proven track records of results.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <Target className="h-10 w-10 text-secondary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Modern Teaching Methods</h3>
                    <p className="text-muted-foreground">
                      We combine real-life applications, visual learning, exam-focused drills, and interactive explanations to guarantee understanding.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <Users className="h-10 w-10 text-accent mb-3" />
                    <h3 className="text-xl font-bold mb-2">Personalized Academic Coaching</h3>
                    <p className="text-muted-foreground">
                      Every student receives tailored guidance to help them overcome their unique academic challenges.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <TrendingUp className="h-10 w-10 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Record-Breaking Results</h3>
                    <p className="text-muted-foreground">
                      From JAMB 300+ scorers to WAEC distinctions and high-performing university students, our results speak louder than words.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow md:col-span-2">
                  <CardContent className="pt-6">
                    <Award className="h-10 w-10 text-secondary mb-3" />
                    <h3 className="text-xl font-bold mb-2">Mentorship Beyond the Classroom</h3>
                    <p className="text-muted-foreground">
                      We train students in discipline, confidence, critical thinking, exam strategy, and academic planning.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
