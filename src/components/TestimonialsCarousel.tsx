import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import reviewMarvelous from "@/assets/review-marvelous.jpg";
import reviewBlessing from "@/assets/review-blessing.jpg";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const testimonials = [
  {
    name: "Marvelous Olaleye",
    program: "200L Radiography Student, FUOYE",
    image: reviewMarvelous,
    quote: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    quoteAuthor: "Malcolm X",
    review: `Hi there, my name is Olaleye Marvellous, a 200L Radiography Student of this great citadel of learning, Federal University, Oye Ekiti.

Life in 100L as a fresher can be overwhelming as you are just getting to know the environment and also trying to catch up with the academic curriculum. That was how it was for me and so many other students.

I attended Genius Lab Tutorial for the first time and I instantly knew that my journey was going to be aided.

The simplified teachings and words of encouragement always create an ever-present urge for me to pick up my book and read even when I feel lazy at times. I believe this shaped me and helped me attain a GPA of 5.0 and CGPA of 4.82 at the end of 100L session.

As someone that has gone through this phase and passed excellently, I can tell you that everything you wish to achieve is possible.

Pray, study hard and do not take tutorial classes at GeniusLab for granted. The tutors will always do their best to teach you and make you understand in the most simplified way but it's left to you to take them seriously.`,
    color: "primary"
  },
  {
    name: "Okpe Ambless Mercy",
    program: "200L Pure & Applied Chemistry, FUOYE",
    image: reviewBlessing,
    review: `I'm Okpe Ambless Mercy, a 200 Level student, Pure & Applied Chemistry, FUOYE.

During my 100-level year at the Federal University of Oye-Ekiti, I resumed late and missed several important lectures. This affected my understanding of the early topics, and I struggled to keep up with the pace of my courses. However, joining Genius Lab Tutorial became a major turning point in my academic journey.

The tutorial provided a supportive and well-structured learning environment. The tutor was patient, accommodating, and taught in a way that made complex topics simple and easy to understand. Through consistent attendance, I was able to catch up with my classmates, regain confidence, and build a strong academic foundation—especially in chemistry.

Looking back now as a 200-level student, I can clearly see how much Genius Lab Tutorial contributed to my progress. The knowledge I gained there continues to help me till today.

To every student currently attending Genius Lab Tutorial, my sincere advice is to take the classes seriously. The lessons you receive will not only help you now but also prepare you for higher levels. Thank you.`,
    color: "secondary"
  }
];

export const TestimonialsCarousel = () => {
  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true })
  );

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
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in border-2">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                      {/* Image and Basic Info */}
                      <div className="flex flex-col items-center md:w-1/3 shrink-0">
                        <div className={`w-40 h-40 rounded-full overflow-hidden mb-4 shadow-2xl border-4 border-${testimonial.color}/20 ring-4 ring-${testimonial.color}/10`}>
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className={`text-2xl font-bold text-${testimonial.color} text-center`}>
                          {testimonial.name}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          {testimonial.program}
                        </p>
                        <div className="flex gap-1 mt-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-5 w-5 fill-${testimonial.color} text-${testimonial.color}`} 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1 md:w-2/3">
                        {testimonial.quote && (
                          <blockquote className="italic text-base text-muted-foreground mb-6 border-l-4 border-primary/30 pl-4 py-2">
                            "{testimonial.quote}"
                            {testimonial.quoteAuthor && (
                              <span className="block text-sm mt-1 font-semibold">
                                - {testimonial.quoteAuthor}
                              </span>
                            )}
                          </blockquote>
                        )}
                        
                        <div className="text-muted-foreground">
                          <ExpandableText text={testimonial.review} maxWords={100} />
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
        {testimonials.map((_, index) => (
          <div
            key={index}
            className="h-2 w-12 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};
