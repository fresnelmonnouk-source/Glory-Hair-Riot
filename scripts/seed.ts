import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleWigs = [
  {
    name: 'Lace Front Blonde',
    slug: 'lace-front-blonde',
    description: 'Perruque blonde premium avec lace front',
    long_description:
      'Notre perruque Lace Front Blonde est confectionnée avec des cheveux humains de haute qualité. Elle offre une finition naturelle incomparable avec une structure en lace front pour une apparence ultra-réaliste.',
    base_price: 15000, // 150€ in cents
    category: 'straight',
    hair_type: 'human',
    length: 'long',
    color: 'blonde',
    stock_quantity: 10,
    sku: 'LFB-001',
    featured: true,
    active: true,
  },
  {
    name: 'Curly Chocolate',
    slug: 'curly-chocolate',
    description: 'Perruque bouclée chocolat pour cheveux afros',
    long_description:
      'Perruque curly design spécialement pour les cheveux de type afro. Textures naturelles bouclées avec volume optimal.',
    base_price: 12000, // 120€
    category: 'curly',
    hair_type: 'human',
    length: 'medium',
    color: 'chocolate',
    stock_quantity: 8,
    sku: 'CUR-001',
    featured: true,
    active: true,
  },
  {
    name: 'Wavy Caramel',
    slug: 'wavy-caramel',
    description: 'Perruque ondulée caramel polyvalente',
    long_description:
      'La perruque ondulée Caramel est polyvalente et convient à tous les types de visages. Ses vagues douces et son couleur caramel apportent chaleur et volume.',
    base_price: 10000, // 100€
    category: 'wavy',
    hair_type: 'human',
    length: 'long',
    color: 'caramel',
    stock_quantity: 12,
    sku: 'WAV-001',
    featured: false,
    active: true,
  },
  {
    name: 'Synthetic Straight Black',
    slug: 'synthetic-straight-black',
    description: 'Perruque synthétique noire lisse',
    long_description:
      'Perruque synthétique de qualité premium en cheveux noirs lisses. Idéale pour un look élégant et professionnel.',
    base_price: 7000, // 70€
    category: 'straight',
    hair_type: 'synthetic',
    length: 'medium',
    color: 'black',
    stock_quantity: 15,
    sku: 'SYN-001',
    featured: false,
    active: true,
  },
  {
    name: 'Braided Crown',
    slug: 'braided-crown',
    description: 'Coiffure en tresses intégrales',
    long_description:
      'Perruque avec tresses intégrales style couronne. Parfaite pour une protection des cheveux naturels.',
    base_price: 18000, // 180€
    category: 'braided',
    hair_type: 'human',
    length: 'long',
    color: 'black',
    stock_quantity: 5,
    sku: 'BRD-001',
    featured: true,
    active: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Insert wigs
    console.log('📝 Adding wigs...');
    const { data: wigs, error: wigsError } = await supabase
      .from('wigs')
      .insert(sampleWigs)
      .select();

    if (wigsError) {
      console.error('Error inserting wigs:', wigsError);
      return;
    }

    console.log(`✅ Added ${wigs.length} wigs`);

    // Add variants for first wig
    if (wigs.length > 0) {
      const firstWig = wigs[0];
      console.log('📝 Adding variants...');

      const variants = [
        {
          wig_id: firstWig.id,
          variant_name: 'Taille M (56-58cm)',
          variant_sku: `${firstWig.sku}-M`,
          stock_quantity: 5,
        },
        {
          wig_id: firstWig.id,
          variant_name: 'Taille L (58-60cm)',
          variant_sku: `${firstWig.sku}-L`,
          stock_quantity: 5,
        },
      ];

      const { data: insertedVariants, error: variantsError } = await supabase
        .from('wig_variants')
        .insert(variants)
        .select();

      if (variantsError) {
        console.error('Error inserting variants:', variantsError);
      } else {
        console.log(`✅ Added ${insertedVariants.length} variants`);
      }
    }

    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();
