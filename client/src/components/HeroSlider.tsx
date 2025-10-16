import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const slides = [
  {
    title: "Government Schemes for Women",
    description: "Access hundreds of empowerment schemes, financial assistance, and support programs",
    image: "/img/government scheme for women.jpg",
    cta: "Explore Schemes",
    link: "/women-safety"
  },
  {
    title: "Disaster Alert System",
    description: "Real-time weather forecasting and disaster zone mapping to keep you safe",
    image: "/img/Disaster alert system.png",
    cta: "View Alerts",
    link: "/disaster"
  },
  {
    title: "Smart Farming Intelligence",
    description: "AI-powered crop recommendations based on soil fertility and weather predictions",
    image: "/img/Smart Farming intelligence.png",
    cta: "Get Recommendations",
    link: "/farmers"
  },
  {
    title: "Danger Zone Alerts",
    description: "Stay informed about high-risk areas with real-time location-based notifications",
    image: "/img/Danger Zone Alerts.jpg",
    cta: "Enable Tracking",
    link: "/women-safety"
  }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-lg">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="relative w-full h-full">
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=500&fit=crop&crop=center`;
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
              <div className="max-w-3xl text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {slide.title}
                </h2>
                <p className="text-base md:text-lg text-white/90">
                  {slide.description}
                </p>
                <Button 
                  size="lg" 
                  className="mt-4" 
                  onClick={() => setLocation(slides[currentSlide].link)}
                  data-testid={`button-slider-cta-${index}`}
                >
                  {slide.cta}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover-elevate active-elevate-2 border"
        data-testid="button-slider-prev"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover-elevate active-elevate-2 border"
        data-testid="button-slider-next"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentSlide 
                ? "bg-primary w-8" 
                : "bg-muted-foreground/50 hover-elevate"
            )}
            data-testid={`button-slider-dot-${index}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
