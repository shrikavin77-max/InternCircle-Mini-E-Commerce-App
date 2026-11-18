/**
 * LUXORA — Product Catalog Data Repository
 * 12 realistic curated creations spanning Timepieces, Leather Goods, Fragrances, and Lifestyle.
 * Realistic pricing includes accessible luxury essentials (allowing testing of the ₹500 delivery threshold)
 * and flagship horology / bespoke leather pieces.
 */

const PRODUCTS = [
  {
    id: "lx-001",
    name: "L'Etoile Minimalist Chronograph",
    category: "Timepieces",
    price: 18500,
    rating: 4.9,
    reviewsCount: 38,
    badge: "Signature",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    description: "An understated 38mm automatic chronograph featuring scratch-resistant sapphire crystal glass, 316L surgical stainless steel case, and a hand-stitched Tuscan calfskin strap.",
    details: {
      origin: "Geneva Atelier",
      movement: "Calibre LX-102 Automatic",
      caseDiameter: "38 mm",
      waterResistance: "50 Meters (5 ATM)"
    }
  },
  {
    id: "lx-002",
    name: "Sovereign Perpetual Heritage Watch",
    category: "Timepieces",
    price: 26000,
    rating: 5.0,
    reviewsCount: 24,
    badge: "Limited Edition",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    description: "Featuring an exhibition caseback displaying intricate Geneva stripes, blued steel hands, and a sunburst slate dial with Roman numerals.",
    details: {
      origin: "Geneva Atelier",
      movement: "Bespoke Skeleton Automatic",
      caseDiameter: "40 mm",
      waterResistance: "30 Meters (3 ATM)"
    }
  },
  {
    id: "lx-003",
    name: "Palermo Full-Grain Leather Briefcase",
    category: "Leather Goods",
    price: 12500,
    rating: 4.8,
    reviewsCount: 42,
    badge: "Artisanal",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    description: "Mastercrafted from vegetable-tanned French saddle leather that develops a rich, individual patina with age. Features solid brass hardware and padded laptop partition.",
    details: {
      origin: "Florence Studio",
      material: "Full-Grain Vegetable Tanned Calfskin",
      hardware: "Antiqued Solid Brass",
      capacity: "Up to 15-inch Laptop"
    }
  },
  {
    id: "lx-004",
    name: "Atelier Bifold Cardholder",
    category: "Leather Goods",
    price: 2400,
    rating: 4.7,
    reviewsCount: 89,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    description: "Slim silhouette crafted with hand-beveled edges, six card slots, and an RFID-shielded central bill compartment. Fits effortlessly into tailored trouser pockets.",
    details: {
      origin: "Florence Studio",
      material: "Smooth Nappa Leather",
      dimensions: "10 cm x 7.5 cm",
      slots: "6 Card Slots + Central Note Slot"
    }
  },
  {
    id: "lx-005",
    name: "Santorini Pure Brass Key Fob",
    category: "Leather Goods",
    price: 450, // Below ₹500 (Ideal for testing ₹40 delivery fee)
    rating: 4.6,
    reviewsCount: 56,
    badge: "Essential",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    description: "A solid sand-cast brass ring bound with hand-dyed bridle leather loop. Compact, tactile, and designed for daily carrying.",
    details: {
      origin: "Kyoto Workshop",
      material: "Solid Brass & Bridle Leather",
      weight: "48 grams",
      finish: "Raw Brushed Brass"
    }
  },
  {
    id: "lx-006",
    name: "Santal Impérial Extrait de Parfum",
    category: "Fragrances",
    price: 8900,
    rating: 4.9,
    reviewsCount: 65,
    badge: "Signature",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    description: "An intoxicating 30% concentration blend of creamy Mysore sandalwood, Florentine iris, Haitian vetiver, and smoky ambergris. Housed in a heavy lead crystal flacon.",
    details: {
      origin: "Grasse Laboratory",
      concentration: "Extrait de Parfum (30%)",
      volume: "50 ml / 1.7 fl.oz",
      olfactoryFamily: "Woody Oriental"
    }
  },
  {
    id: "lx-007",
    name: "Ambre Nocturne Botanical Candle",
    category: "Fragrances",
    price: 1800,
    rating: 4.8,
    reviewsCount: 71,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
    description: "Poured by hand using 100% natural soy wax infused with essential oils of dark amber, smoked cedar, and crushed tonka bean. Offers 55 hours of clean, soot-free burn.",
    details: {
      origin: "Provence Atelier",
      wax: "100% Non-GMO Soy Wax",
      burnTime: "55 Hours",
      wick: "Lead-free Organic Cotton"
    }
  },
  {
    id: "lx-008",
    name: "Bergamote Sauvage Discovery Atomiser",
    category: "Fragrances",
    price: 490, // Below ₹500 (Ideal for testing ₹40 delivery fee)
    rating: 4.5,
    reviewsCount: 112,
    badge: "Discovery",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    description: "Pocket travel atomizer featuring sun-drenched Calabrian bergamot, green petitgrain, and clean white cedar. Sized for evening clutches or blazer pockets.",
    details: {
      origin: "Grasse Laboratory",
      concentration: "Eau de Parfum",
      volume: "10 ml / 0.34 fl.oz",
      refillable: "Yes"
    }
  },
  {
    id: "lx-009",
    name: "Himalayan Grade-A Cashmere Scarf",
    category: "Lifestyle",
    price: 6500,
    rating: 5.0,
    reviewsCount: 31,
    badge: "Heritage",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
    description: "Woven on wooden pitlooms using pure underfleece from high-altitude Changthangi capra goats. Feathery, weightless warmth with eyelash fringe hems.",
    details: {
      origin: "Kashmir Highlands",
      material: "100% Changthangi Cashmere",
      dimensions: "200 cm x 70 cm",
      weave: "Fine Diamond Weave"
    }
  },
  {
    id: "lx-010",
    name: "Como Mulberry Silk Pocket Square",
    category: "Lifestyle",
    price: 500, // Exactly ₹500 (Ideal for testing boundary condition for Free Delivery)
    rating: 4.7,
    reviewsCount: 44,
    badge: "Classic",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    description: "Hand-rolled and hand-sewn hem pocket square printed on 16 momme pure twill silk along the shores of Lake Como. Displays a muted geometric arabesque motif.",
    details: {
      origin: "Lake Como Mill",
      material: "100% Mulberry Twill Silk",
      dimensions: "33 cm x 33 cm",
      hem: "Hand-Rolled"
    }
  },
  {
    id: "lx-011",
    name: "Obsidian Marble Desk Vessel",
    category: "Lifestyle",
    price: 3200,
    rating: 4.8,
    reviewsCount: 19,
    badge: "Artisanal",
    image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
    description: "Carved from a single solid block of Spanish Nero Marquina marble with organic white veining. Substantial weight for pens, luxury stationery, or bedside essentials.",
    details: {
      origin: "Bilbao Quarry",
      material: "Natural Nero Marquina Marble",
      finish: "Honed Matte Silk",
      weight: "1.1 kg"
    }
  },
  {
    id: "lx-012",
    name: "Artisan Leather Cable Wrap (Set of 2)",
    category: "Leather Goods",
    price: 350, // Below ₹500 (Ideal for testing ₹40 delivery fee)
    rating: 4.6,
    reviewsCount: 88,
    badge: "Essential",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Minimalist vegetable-tanned cord organizers with burnished raw edges and antique brass snap closure to keep headphone cables and chargers tangle-free.",
    details: {
      origin: "Florence Studio",
      material: "Tuscan Vachetta Leather",
      hardware: "Antiqued Brass Snaps",
      set: "2 Organizers (Chestnut & Noir)"
    }
  }
];

// Provide helper function to find product by ID
function getProductById(id) {
  return PRODUCTS.find(product => product.id === id);
}

// Ensure globally accessible
window.PRODUCTS = PRODUCTS;
window.getProductById = getProductById;
