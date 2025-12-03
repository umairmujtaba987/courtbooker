import { Link, useLocation } from "wouter";
import { Calendar, Clock, MapPin, ArrowRight, LogIn, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CricketIcon, FootballIcon } from "@/components/icons";
import heroImage from "@assets/generated_images/indoor_sports_complex_hero_image.png";

interface HomeProps {
  isAuthenticated?: boolean;
}

export default function Home({ isAuthenticated = false }: HomeProps) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Book Your Court
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            Premium indoor courts for Cricket & Football. Two courts available with
            flexible hourly slots from 6 AM to 11 PM.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="rounded-xl px-8 font-semibold"
              onClick={() => {
                if (!isAuthenticated) {
                  setLocation("/admin");
                } else {
                  setLocation("/availability");
                }
              }}
              data-testid="button-check-availability"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Check Availability
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-8 font-semibold bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              onClick={() => {
                setLocation(isAuthenticated ? "/dashboard" : "/admin");
              }}
              data-testid={isAuthenticated ? "button-view-dashboard" : "button-admin-login"}
            >
              {isAuthenticated ? (
                <>
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Dashboard
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Admin Login
                </>
              )}
            </Button>
          </div>
          
          <Card className="max-w-3xl mx-auto bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl border-0">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Quick Booking Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <CricketIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Cricket</p>
                    <p className="text-sm text-muted-foreground">PKR 2,000/hour</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/10">
                    <FootballIcon className="h-6 w-6 text-chart-2" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Football</p>
                    <p className="text-sm text-muted-foreground">PKR 2,500/hour</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/10">
                    <Clock className="h-6 w-6 text-chart-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Hours</p>
                    <p className="text-sm text-muted-foreground">6 AM - 11 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Courts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover-elevate overflow-visible">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Court A</h3>
                    <p className="text-muted-foreground">Premium Indoor Court</p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Professional grade surface
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    LED floodlights
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Climate controlled
                  </li>
                </ul>
                <Button 
                  className="w-full rounded-xl" 
                  onClick={() => {
                    if (!isAuthenticated) {
                      setLocation("/admin");
                    } else {
                      setLocation("/availability?court=court-a");
                    }
                  }}
                  data-testid="button-book-court-a"
                >
                  Book Court A
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate overflow-visible">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-chart-2/10">
                    <MapPin className="h-7 w-7 text-chart-2" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Court B</h3>
                    <p className="text-muted-foreground">Premium Indoor Court</p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                    Professional grade surface
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                    LED floodlights
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                    Climate controlled
                  </li>
                </ul>
                <Button 
                  className="w-full rounded-xl" 
                  variant="secondary"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setLocation("/admin");
                    } else {
                      setLocation("/availability?court=court-b");
                    }
                  }}
                  data-testid="button-book-court-b"
                >
                  Book Court B
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Select Date & Court</h3>
              <p className="text-muted-foreground">
                Choose your preferred date and court to see available time slots
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-2 text-white text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Pick Your Slot</h3>
              <p className="text-muted-foreground">
                Select your sport and the time slot that works best for you
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-4 text-white text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Confirm Booking</h3>
              <p className="text-muted-foreground">
                Fill in your details and confirm. You're all set to play!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
