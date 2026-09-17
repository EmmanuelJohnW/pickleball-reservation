import Link from "next/link";
import { CircleDot, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <CircleDot className="h-7 w-7 text-green-400" />
              <span>Court ni Wardo</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Your premier pickleball destination. Indoor and outdoor courts with
              professional-grade surfaces, lighting, and amenities. Book your court
              today and experience the fastest-growing sport.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/book" className="hover:text-green-400 transition-colors">
                  Book a Court
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-green-400 transition-colors">
                  Track Reservation
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-green-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-green-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-green-400 shrink-0" />
                <span>Lapu-Lapu City, Cebu, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-400 shrink-0" />
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-400 shrink-0" />
                <span>info@picklezone.ph</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>; {new Date().getFullYear()} Court ni Wardo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
