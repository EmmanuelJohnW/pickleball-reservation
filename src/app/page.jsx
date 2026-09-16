import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  CreditCard,
  CircleDot,
  Zap,
  Shield,
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  Landmark,
  Cloud,
  Users,
  Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 backdrop-blur">
                <CircleDot className="h-4 w-4" />
                <span>Pickleball Court Reservations</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Book Your Court.
                <br />
                <span className="text-yellow-300">Play Pickleball.</span>
              </h1>
              <p className="text-lg md:text-xl text-green-100 mb-8 max-w-xl mx-auto">
                The fastest-growing sport deserves the best courts. Reserve your
                pickleball court in seconds — no account needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold text-lg px-8 py-6 rounded-xl transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                  Book a Court
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium text-lg px-8 py-6 rounded-xl transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                How Booking Works
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                Book your court in 4 simple steps
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  icon: <Calendar className="h-6 w-6" />,
                  title: "Choose Date",
                  desc: "Select your preferred date from our interactive calendar.",
                },
                {
                  step: "2",
                  icon: <Landmark className="h-6 w-6" />,
                  title: "Pick a Court",
                  desc: "Choose from indoor or outdoor courts based on your preference.",
                },
                {
                  step: "3",
                  icon: <Clock className="h-6 w-6" />,
                  title: "Select Time",
                  desc: "Pick an available time slot that works for you.",
                },
                {
                  step: "4",
                  icon: <CreditCard className="h-6 w-6" />,
                  title: "Pay ",
                  desc: "Complete your booking with GCash, GoTyme, or cash.",
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                    {item.icon}
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-green-900 rounded-full text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Available Courts */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Our Courts
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                Premium pickleball courts for every level of play
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Court 1", type: "Indoor", price: 350, features: ["Professional Lighting", "AC Cooled"], icon: <Landmark className="h-5 w-5" /> },
                { name: "Court 2", type: "Indoor", price: 350, features: ["Spectator Seating", "Pro Surface"], icon: <Landmark className="h-5 w-5" /> },
                { name: "Court 3", type: "Outdoor", price: 300, features: ["Shade Cover", "Wind Screens"], icon: <Cloud className="h-5 w-5" /> },
                { name: "Court 4", type: "Outdoor", price: 300, features: ["Night Lighting", "Fenced"], icon: <Cloud className="h-5 w-5" /> },
                { name: "Court 5", type: "Indoor", price: 400, features: ["Premium AC", "VIP Access"], icon: <Landmark className="h-5 w-5" /> },
                { name: "Court 6", type: "Outdoor", price: 320, features: ["LED Lighting", "Scoreboard"], icon: <Cloud className="h-5 w-5" /> },
              ].map((court, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{court.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {court.icon}
                          <span>{court.type}</span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-green-700">
                        ₱{court.price}/hr
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {court.features.map((f, j) => (
                        <span key={j} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Court Pricing</h2>
              <p className="text-gray-500 text-lg">Simple, transparent pricing</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-2 border-green-200">
                <CardContent className="p-6 text-center">
                  <Cloud className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Outdoor Courts</h3>
                  <div className="text-3xl font-bold text-green-700 mb-2">₱300</div>
                  <p className="text-sm text-gray-500">per hour</p>
                  <p className="text-xs text-gray-400 mt-2">Courts 3, 4, 6</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-600 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Popular
                </div>
                <CardContent className="p-6 text-center">
                  <Landmark className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Indoor Courts</h3>
                  <div className="text-3xl font-bold text-green-700 mb-2">₱350</div>
                  <p className="text-sm text-gray-500">per hour</p>
                  <p className="text-xs text-gray-400 mt-2">Courts 1, 2</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-yellow-300">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Premium Indoor</h3>
                  <div className="text-3xl font-bold text-green-700 mb-2">₱400</div>
                  <p className="text-sm text-gray-500">per hour</p>
                  <p className="text-xs text-gray-400 mt-2">Court 5 (VIP)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Operating Hours</h2>
              <p className="text-gray-500 text-lg">Open 7 days a week</p>
            </div>
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border p-6">
              <div className="space-y-3">
                {[
                  { day: "Monday – Friday", hours: "8:00 AM – 10:00 PM" },
                  { day: "Saturday", hours: "8:00 AM – 10:00 PM" },
                  { day: "Sunday", hours: "8:00 AM – 10:00 PM" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="font-medium text-gray-700">{item.day}</span>
                    <span className="text-green-700 font-semibold">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="h-6 w-6" />, title: "Instant Booking", desc: "Reserve your court in under 60 seconds. No account needed." },
                { icon: <Shield className="h-6 w-6" />, title: "Secure Payment", desc: "Pay with GCash, GoTyme, or cash. Your payment is protected." },
                { icon: <Users className="h-6 w-6" />, title: "No Registration", desc: "Just enter your name, email, and phone. That's it." },
              ].map((item, i) => (
                <div key={i} className="text-center p-6">
                  <div className="w-12 h-12 bg-green-100 text-green-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-2xl mx-auto space-y-4">
              {[
                { q: "Do I need to create an account to book?", a: "No Just enter your name, email, and phone number. Booking is fast and simple." },
                { q: "What payment methods do you accept?", a: "We accept GCash, GoTyme, and cash payments. Online payments are processed securely." },
                { q: "Can I cancel my reservation?", a: "No. All bookings are final and non-refundable, including cancellations or no-shows." },
                { q: "Can I reschedule my reservation?", a: "No. Once booked, reservations cannot be rescheduled. Please double-check your date and time before paying." },
                { q: "Are the courts suitable for beginners?", a: "Absolutely Our courts welcome players of all skill levels. We also offer equipment rental." },
                { q: "What happens if it rains for outdoor courts?", a: "Outdoor courts are booked on a first-come, first-served basis and weather is the customer's risk. No refunds or rescheduling will be provided due to weather conditions." },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-500">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Play?</h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Book your pickleball court now and join the fastest-growing sport in the Philippines.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold text-lg px-8 py-6 rounded-xl transition-colors"
            >
              Book a Court Now
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Location  */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Find Us</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl">
                <MapPin className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                <p className="text-sm text-gray-500">Lapu-Lapu City<br />Cebu, Philippines</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl">
                <Phone className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <p className="text-sm text-gray-500">+63 912 345 6789</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl">
                <Mail className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-sm text-gray-500">info@picklezone.ph</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
