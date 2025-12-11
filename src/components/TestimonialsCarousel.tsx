import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, Loader2 } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import { supabase } from "@/integrations/supabase/client";
import Autoplay from "embla-carousel-autoplay";

// Default fallback images
import reviewMarvelous from "@/assets/review-marvelous.jpg";
import reviewBlessing from "@/assets/review-blessing.jpg";
import reviewEmmanuel from "@/assets/review-emmanuel.jpg";

interface SuccessStory {
  id: string;
  student_name: string;
  program: string;
  image_url: string | null;
  quote: string;
  quote_author: string | null;
  review: string;
  color_theme: string;
  display_order: number;
}

// Fallback data if database is empty
const fallbackTestimonials = [
  {
    id: "1",
    student_name: "Marvelous Olaleye",
    program: "200L Radiography Student, FUOYE",
    image_url: reviewMarvelous,
    quote: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    quote_author: "Malcolm X",
    review: `Hi there, my name is Olaleye Marvellous, a 200L Radiography Student of this great citadel of learning, Federal University, Oye Ekiti.

Life in 100L as a fresher can be overwhelming as you are just getting to know the environment and also trying to catch up with the academic curriculum. That was how it was for me and so many other students.

I attended Genius Lab Tutorial for the first time and I instantly knew that my journey was going to be aided.

The simplified teachings and words of encouragement always create an ever-present urge for me to pick up my book and read even when I feel lazy at times. I believe this shaped me and helped me attain a GPA of 5.0 and CGPA of 4.82 at the end of 100L session.`,
    color_theme: "primary",
    display_order: 1,
  },
  {
    id: "2",
    student_name: "Okpe Ambless Mercy",
    program: "200L Pure & Applied Chemistry, FUOYE",
    image_url: reviewBlessing,
    quote: "",
    quote_author: null,
    review: `I'm Okpe Ambless Mercy, a 200 Level student, Pure & Applied Chemistry, FUOYE.

During my 100-level year at the Federal University of Oye-Ekiti, I resumed late and missed several important lectures. This affected my understanding of the early topics, and I struggled to keep up with the pace of my courses. However, joining Genius Lab Tutorial became a major turning point in my academic journey.

The tutorial provided a supportive and well-structured learning environment. The tutor was patient, accommodating, and taught in a way that made complex topics simple and easy to understand.`,
    color_theme: "secondary",
    display_order: 2,
  },
  {
    id: "3",
    student_name: "Okunlola Emmanuel",
    program: "Nursing Department, FUOYE",
    image_url: reviewEmmanuel,
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    quote_author: "B.B. King",
    review: `My name is Okunlola Emmanuel, a proud student of the Nursing Department at Federal University Oye-Ekiti – an esteemed institution that nurtures future leaders across every discipline.

Entering university as a 100-level student, I faced overcrowded lecture halls. The sheer volume of students made me feel like a sardine in a can, and the relentless pace of coursework was overwhelming. Yet, I resolved not to be defeated.

A pivotal moment arrived when I began attending Genius Lab tutorials. Their innovative teaching methods broadened my horizons and taught me strategic study efficiency.`,
    color_theme: "primary",
    display_order: 3,
  },
];

// Map student names to fallback images
const nameImageMap: { [key: string]: string } = {
  "Marvelous Olaleye": reviewMarvelous,
  "Okpe Ambless Mercy": reviewBlessing,
  "Okunlola Emmanuel": reviewEmmanuel,
  "Emmanuel Okunlola": reviewEmmanuel,
  "Blessing Idoko": reviewBlessing,
  "Marvelous Adekunle": reviewMarvelous,
};

export const TestimonialsCarousel = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true })
  );

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("success_stories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStories(data);
        } else {
          // Use fallback data if database is empty
          setStories(fallbackTestimonials as SuccessStory[]);
        }
      } catch (error) {
        console.error("Error fetching success stories:", error);
        // Use fallback data on error
        setStories(fallbackTestimonials as SuccessStory[]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const getStoryImage = (story: SuccessStory) => {
    if (story.image_url) return story.image_url;
    if (nameImageMap[story.student_name]) return nameImageMap[story.student_name];
    return reviewEmmanuel; // Default fallback
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative max-w-5xl mx-auto px-4">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={() => plugin.current.stop()}
        onMouseLeave={() => plugin.current.reset()}
      >
        <CarouselContent>
          {stories.map((story) => (
            <CarouselItem key={story.id}>
              <div className="p-1">
                <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in border-2">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                      {/* Image and Basic Info */}
                      <div className="flex flex-col items-center md:w-1/3 shrink-0">
                        <div className="w-40 h-40 rounded-full overflow-hidden mb-4 shadow-2xl border-4 border-emerald-500/40 ring-4 ring-emerald-500/20">
                          <img 
                            src={getStoryImage(story)} 
                            alt={story.student_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="border-2 border-emerald-500/30 rounded-lg px-4 py-2 bg-emerald-500/5">
                          <h3 className="text-2xl font-bold text-emerald-600 text-center">
                            {story.student_name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          {story.program}
                        </p>
                        <div className="flex gap-1 mt-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className="h-5 w-5 fill-emerald-500 text-emerald-500" 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1 md:w-2/3">
                        {story.quote && (
                          <blockquote className="italic text-base text-muted-foreground mb-6 border-l-4 border-primary/30 pl-4 py-2">
                            "{story.quote}"
                            {story.quote_author && (
                              <span className="block text-sm mt-1 font-semibold">
                                - {story.quote_author}
                              </span>
                            )}
                          </blockquote>
                        )}
                        
                        <div className="text-muted-foreground">
                          <ExpandableText text={story.review} maxWords={30} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Controls */}
        <CarouselPrevious className="left-0 md:-left-12 shadow-lg hover:shadow-xl transition-all hover:scale-110" />
        <CarouselNext className="right-0 md:-right-12 shadow-lg hover:shadow-xl transition-all hover:scale-110" />
      </Carousel>
      
      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {stories.map((_, index) => (
          <div
            key={index}
            className="h-2 w-12 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};
