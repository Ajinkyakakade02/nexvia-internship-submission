import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import VendorProfile from '../models/VendorProfile.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import { UserRole, OnboardingStatus, ProductStatus, DiscountType } from '../types/index.js';
import logger from '../utils/logger.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Connected to database. Starting seed process...');

    // 1. Clear existing seed collections
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({})
    ]);

    // 2. Categories
    const categoriesData = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Smartphones, laptops, smart home gear and accessories',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60'
      },
      {
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        description: 'Clothing, footwear and timeless accessories for men and women',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=60'
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Modern cookware, home decor, furniture and kitchen appliances',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60'
      },
      {
        name: 'Books & Stationery',
        slug: 'books-stationery',
        description: 'Bestselling novels, educational materials and desk essentials',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60'
      },
      {
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        description: 'Workout equipment, athletic wear and outdoor essentials',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60'
      },
      {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Skincare, organic haircare, cosmetics and wellness products',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60'
      }
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    logger.info(`Seeded ${createdCategories.length} categories`);

    // 3. Demo Vendors
    const vendorUsersData = [
      {
        name: 'Apex Digital Store',
        email: 'vendor.apex@example.com',
        password: 'Password123!',
        phone: '+91 9876543210',
        businessName: 'Apex Digital Technologies Pvt Ltd',
        businessDescription: 'Authorized retailer of high-performance electronics and audio equipment',
        businessAddress: '42 Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103',
        gstNumber: '29ABCDE1234F1Z5'
      },
      {
        name: 'Urban Threads Studio',
        email: 'vendor.urban@example.com',
        password: 'Password123!',
        phone: '+91 9876543211',
        businessName: 'Urban Threads Fashion LLP',
        businessDescription: 'Sustainable modern streetwear and premium casual attire',
        businessAddress: '15 Fashion Street, Bandra West, Mumbai, Maharashtra 400050',
        gstNumber: '27AABCT9876K1Z2'
      },
      {
        name: 'EcoLiving Living Goods',
        email: 'vendor.ecoliving@example.com',
        password: 'Password123!',
        phone: '+91 9876543212',
        businessName: 'EcoLiving Home Products Ltd',
        businessDescription: 'Eco-conscious home essentials, kitchenware, and organic textiles',
        businessAddress: '8 Green Avenue, Jubilee Hills, Hyderabad, Telangana 500033',
        gstNumber: '36AAACE4567H1Z8'
      }
    ];

    const createdVendors: any[] = [];
    for (const vData of vendorUsersData) {
      let vUser = await User.findOne({ email: vData.email });
      if (!vUser) {
        vUser = new User({
          name: vData.name,
          email: vData.email,
          passwordHash: vData.password,
          role: UserRole.VENDOR,
          phone: vData.phone,
          isActive: true
        });
        await vUser.save();
      }

      await VendorProfile.findOneAndUpdate(
        { user: vUser._id },
        {
          user: vUser._id,
          businessName: vData.businessName,
          businessDescription: vData.businessDescription,
          businessEmail: vData.email,
          businessPhone: vData.phone,
          businessAddress: vData.businessAddress,
          gstNumber: vData.gstNumber,
          onboardingStatus: OnboardingStatus.APPROVED,
          approvedAt: new Date()
        },
        { upsert: true, new: true }
      );
      createdVendors.push(vUser);
    }
    logger.info(`Seeded ${createdVendors.length} vendors with approved profiles`);

    // 4. Demo Customers
    const customerData = [
      {
        name: 'Aarav Sharma',
        email: 'customer.aarav@example.com',
        password: 'Password123!',
        phone: '+91 9123456789',
        addresses: [
          {
            fullName: 'Aarav Sharma',
            phone: '+91 9123456789',
            street: 'Flat 402, Sunshine Apartments, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
            isDefault: true
          }
        ]
      },
      {
        name: 'Priya Patel',
        email: 'customer.priya@example.com',
        password: 'Password123!',
        phone: '+91 9234567890',
        addresses: [
          {
            fullName: 'Priya Patel',
            phone: '+91 9234567890',
            street: '12 Blossom Residency, Satellite',
            city: 'Ahmedabad',
            state: 'Gujarat',
            postalCode: '380015',
            country: 'India',
            isDefault: true
          }
        ]
      }
    ];

    const createdCustomers: any[] = [];
    for (const cData of customerData) {
      let cUser = await User.findOne({ email: cData.email });
      if (!cUser) {
        cUser = new User({
          name: cData.name,
          email: cData.email,
          passwordHash: cData.password,
          role: UserRole.CUSTOMER,
          phone: cData.phone,
          addresses: cData.addresses,
          isActive: true
        });
        await cUser.save();
      }
      createdCustomers.push(cUser);
    }
    logger.info(`Seeded ${createdCustomers.length} demo customers`);

    // 5. Products
    const [electronics, fashion, home, books, sports, beauty] = createdCategories;
    const [vendorApex, vendorUrban, vendorEco] = createdVendors;

    const productsData = [
      // Electronics (Vendor Apex)
      {
        vendor: vendorApex._id,
        category: electronics._id,
        name: 'Apex SoundPro Wireless Noise-Cancelling Headphones',
        slug: 'apex-soundpro-wireless-headphones',
        description: 'Premium wireless over-ear headphones with active noise cancellation, 40-hour battery life, and crystal-clear high-fidelity audio drivers.',
        price: 8499,
        comparePrice: 11999,
        stock: 45,
        avgRating: 4.8,
        ratingCount: 32,
        soldCount: 89,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorApex._id,
        category: electronics._id,
        name: 'Apex UltraSlim Mechanical Gaming Keyboard',
        slug: 'apex-ultraslim-mechanical-keyboard',
        description: 'Compact mechanical keyboard with hot-swappable tactile switches, per-key RGB backlighting, and aircraft-grade aluminum top frame.',
        price: 4999,
        comparePrice: 6499,
        stock: 30,
        avgRating: 4.6,
        ratingCount: 18,
        soldCount: 42,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorApex._id,
        category: electronics._id,
        name: 'Apex Vision 4K Ultra HD Action Camera',
        slug: 'apex-vision-4k-action-camera',
        description: 'Waterproof 4K action camera with dual color screens, EIS 3.0 stabilization, and 170-degree ultra-wide lens. Includes mounting kit.',
        price: 12999,
        comparePrice: 15999,
        stock: 22,
        avgRating: 4.5,
        ratingCount: 12,
        soldCount: 27,
        images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorApex._id,
        category: electronics._id,
        name: 'Apex Wireless Charging Pad Duo',
        slug: 'apex-wireless-charging-pad-duo',
        description: 'Fast 15W Qi-certified dual wireless charging pad designed for smartphones, earbuds and smartwatches with intelligent temperature control.',
        price: 1999,
        comparePrice: 2499,
        stock: 65,
        avgRating: 4.3,
        ratingCount: 25,
        soldCount: 110,
        images: ['https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },

      // Fashion (Vendor Urban)
      {
        vendor: vendorUrban._id,
        category: fashion._id,
        name: 'Urban Classic Heavyweight Oversized Hoodie',
        slug: 'urban-classic-oversized-hoodie',
        description: '100% organic combed cotton fleece hoodie with double-layered hood, ribbed cuffs, and minimalist urban silhouette.',
        price: 2499,
        comparePrice: 3299,
        stock: 50,
        avgRating: 4.7,
        ratingCount: 41,
        soldCount: 135,
        images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorUrban._id,
        category: fashion._id,
        name: 'Urban Canvas Minimalist Crossbody Bag',
        slug: 'urban-canvas-crossbody-bag',
        description: 'Water-resistant vintage canvas messenger and sling bag with padded tablet compartment and adjustable webbing strap.',
        price: 1599,
        comparePrice: 2199,
        stock: 38,
        avgRating: 4.4,
        ratingCount: 15,
        soldCount: 68,
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorUrban._id,
        category: fashion._id,
        name: 'Urban Tailored Linen Blend Casual Shirt',
        slug: 'urban-tailored-linen-shirt',
        description: 'Breathable European linen blend shirt tailored for effortless style during warm seasons and casual business settings.',
        price: 1899,
        comparePrice: 2599,
        stock: 40,
        avgRating: 4.5,
        ratingCount: 22,
        soldCount: 74,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },

      // Home & Kitchen (Vendor EcoLiving)
      {
        vendor: vendorEco._id,
        category: home._id,
        name: 'EcoLiving Cast Iron Dutch Oven (5.5 Qt)',
        slug: 'ecoliving-cast-iron-dutch-oven',
        description: 'Heavy-duty enameled cast iron Dutch oven with precision lid for heat retention and superior moisture distribution.',
        price: 4499,
        comparePrice: 5999,
        stock: 25,
        avgRating: 4.9,
        ratingCount: 28,
        soldCount: 52,
        images: ['https://images.unsplash.com/photo-1584990347449-397e51c897f2?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorEco._id,
        category: home._id,
        name: 'EcoLiving Organic Bamboo Cutting Board Set',
        slug: 'ecoliving-bamboo-cutting-board-set',
        description: 'Set of 3 natural antibacterial bamboo cutting boards with deep juice grooves and thumb grip handles.',
        price: 1299,
        comparePrice: 1799,
        stock: 60,
        avgRating: 4.6,
        ratingCount: 35,
        soldCount: 120,
        images: ['https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorEco._id,
        category: home._id,
        name: 'EcoLiving Handcrafted Ceramic Coffee Mug Set',
        slug: 'ecoliving-ceramic-coffee-mugs',
        description: 'Set of 4 artisan matte-finish stoneware ceramic mugs. Microwave and dishwasher safe, 350ml capacity.',
        price: 999,
        comparePrice: 1499,
        stock: 45,
        avgRating: 4.8,
        ratingCount: 19,
        soldCount: 88,
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },

      // Sports & Fitness (Vendor Apex)
      {
        vendor: vendorApex._id,
        category: sports._id,
        name: 'Apex Pro Grip Non-Slip Yoga Mat (6mm)',
        slug: 'apex-pro-grip-yoga-mat',
        description: 'Eco-friendly high-density TPE yoga mat with alignment guidelines and non-slip textured grip for yoga and pilates.',
        price: 1499,
        comparePrice: 1999,
        stock: 55,
        avgRating: 4.7,
        ratingCount: 29,
        soldCount: 95,
        images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorApex._id,
        category: sports._id,
        name: 'Apex Adjustable Steel Dumbbell Set (20kg)',
        slug: 'apex-adjustable-dumbbell-set',
        description: 'Quick-switch adjustable dumbbell pair with knurled ergonomic handles and secure spinlock collars.',
        price: 5999,
        comparePrice: 7999,
        stock: 18,
        avgRating: 4.8,
        ratingCount: 14,
        soldCount: 38,
        images: ['https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },

      // Beauty & Personal Care (Vendor EcoLiving)
      {
        vendor: vendorEco._id,
        category: beauty._id,
        name: 'EcoLiving Botanical Rejuvenating Facial Serum',
        slug: 'ecoliving-botanical-facial-serum',
        description: '100% cold-pressed rosehip and hyaluronic acid face serum for deep hydration, skin brightness and anti-aging care.',
        price: 899,
        comparePrice: 1299,
        stock: 70,
        avgRating: 4.8,
        ratingCount: 45,
        soldCount: 160,
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },
      {
        vendor: vendorEco._id,
        category: beauty._id,
        name: 'EcoLiving Cold-Pressed Argan Hair Oil (100ml)',
        slug: 'ecoliving-argan-hair-oil',
        description: 'Pure Moroccan argan oil enriched with natural Vitamin E to restore frizz-free shine, strength and scalp nourishment.',
        price: 749,
        comparePrice: 999,
        stock: 65,
        avgRating: 4.6,
        ratingCount: 22,
        soldCount: 90,
        images: ['https://images.unsplash.com/photo-1608248597359-00e9cf41d8e1?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      },

      // Books & Stationery (Vendor Urban)
      {
        vendor: vendorUrban._id,
        category: books._id,
        name: 'Urban Leatherbound Refillable Journal',
        slug: 'urban-leatherbound-journal',
        description: 'Distressed genuine leather journal featuring 240 pages of 120gsm fountain pen friendly unlined handmade cotton paper.',
        price: 1199,
        comparePrice: 1599,
        stock: 40,
        avgRating: 4.9,
        ratingCount: 16,
        soldCount: 62,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
        status: ProductStatus.ACTIVE
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    logger.info(`Seeded ${createdProducts.length} products`);

    // Update category product counts
    for (const cat of createdCategories) {
      const count = await Product.countDocuments({ category: cat._id, isDeleted: false });
      await Category.findByIdAndUpdate(cat._id, { productCount: count });
    }

    // 6. Coupons
    const couponsData = [
      {
        code: 'SAVE10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minOrderValue: 500,
        maxDiscount: 1000,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        isActive: true
      },
      {
        code: 'FLAT200',
        discountType: DiscountType.FIXED,
        discountValue: 200,
        minOrderValue: 1500,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 200,
        isActive: true
      },
      {
        code: 'WELCOME20',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        minOrderValue: 1000,
        maxDiscount: 2000,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true
      }
    ];

    await Coupon.insertMany(couponsData);
    logger.info(`Seeded ${couponsData.length} promotional coupons`);

    // 7. Seed Reviews
    const sampleReviews = [
      {
        customer: createdCustomers[0]._id,
        product: createdProducts[0]._id,
        rating: 5,
        title: 'Outstanding sound quality and noise cancellation!',
        comment: 'These headphones exceeded my expectations. The ANC blocks out airplane and traffic noise completely, and battery life easily lasts a whole week of commuting.',
        isVerifiedPurchase: true,
        isApproved: true
      },
      {
        customer: createdCustomers[1]._id,
        product: createdProducts[0]._id,
        rating: 4,
        title: 'Great headphones, very comfortable',
        comment: 'Very lightweight and snug fit. Sound is punchy and detailed. The mic quality during video calls is also very clear.',
        isVerifiedPurchase: true,
        isApproved: true
      },
      {
        customer: createdCustomers[0]._id,
        product: createdProducts[4]._id,
        rating: 5,
        title: 'Super soft material and premium fit',
        comment: 'Top notch quality hoodie. The heavyweight cotton is warm without feeling stiff. Ordered my true size for a perfect relaxed fit.',
        isVerifiedPurchase: true,
        isApproved: true
      },
      {
        customer: createdCustomers[1]._id,
        product: createdProducts[7]._id,
        rating: 5,
        title: 'A kitchen essential for sourdough and stews',
        comment: 'Cooks evenly and cleans up effortlessly. Worth every rupee compared to imported brands charging triple.',
        isVerifiedPurchase: true,
        isApproved: true
      }
    ];

    await Review.insertMany(sampleReviews);
    logger.info(`Seeded ${sampleReviews.length} reviews`);

    logger.info('Database seeding completed successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Error during database seed:', error);
    process.exit(1);
  }
};

seedDatabase();

