import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL! });

const TEST_FACTORIES = [
  { name: "Guangzhou Textiles Co.", location: "Guangzhou, China", address: "88 Tianhe Road, Guangzhou, Guangdong, China", contactName: "Li Wei", contactEmail: "liwei@gztextiles.cn" },
  { name: "Shenzhen Apparel Ltd.", location: "Shenzhen, China", address: "12 Nanshan District, Shenzhen, China", contactName: "Zhang Min", contactEmail: "zhang@szapparel.cn" },
  { name: "Dhaka Garments Factory", location: "Dhaka, Bangladesh", address: "Mirpur DOHS, Dhaka 1216, Bangladesh", contactName: "Rahman Ali", contactEmail: "rahman@dhakagarments.bd" },
  { name: "Istanbul Fashion Works", location: "Istanbul, Turkey", address: "Merter Tekstil Merkezi, Istanbul, Turkey", contactName: "Mehmet Yilmaz", contactEmail: "mehmet@istanbulfashion.tr" },
  { name: "Ho Chi Minh Sewing Co.", location: "Ho Chi Minh City, Vietnam", address: "District 7, HCMC, Vietnam", contactName: "Nguyen Thi", contactEmail: "nguyen@hcmsewing.vn" },
  { name: "Mumbai Fabrics Pvt Ltd", location: "Mumbai, India", address: "Lower Parel, Mumbai 400013, India", contactName: "Priya Sharma", contactEmail: "priya@mumbaifabrics.in" },
  { name: "Jakarta Textile Mills", location: "Jakarta, Indonesia", address: "Jl. Sudirman, Jakarta 12190, Indonesia", contactName: "Budi Santoso", contactEmail: "budi@jakartatextile.id" },
  { name: "Prato Italian Weavers", location: "Prato, Italy", address: "Via Bologna 15, 59100 Prato, Italy", contactName: "Marco Rossi", contactEmail: "marco@pratoweavers.it" },
  { name: "Bangkok Silk House", location: "Bangkok, Thailand", address: "Sukhumvit Soi 24, Bangkok 10110, Thailand", contactName: "Somchai Prem", contactEmail: "somchai@bangkoksilk.th" },
  { name: "Porto Leather Goods", location: "Porto, Portugal", address: "Rua das Flores 42, 4050 Porto, Portugal", contactName: "Ana Silva", contactEmail: "ana@portoleather.pt" },
];

function cuid() {
  return "c" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function main() {
  await client.connect();
  console.log("Connected to database");

  // Find first org
  const orgResult = await client.query('SELECT id, name FROM "Organization" LIMIT 1');
  if (orgResult.rows.length === 0) {
    console.error("No organization found! Create an account first.");
    process.exit(1);
  }
  const org = orgResult.rows[0];
  console.log(`Using organization: ${org.name} (${org.id})`);

  // Check existing
  const countResult = await client.query('SELECT COUNT(*) FROM "Factory" WHERE "organizationId" = $1', [org.id]);
  console.log(`Existing factories: ${countResult.rows[0].count}`);

  let created = 0;
  for (const f of TEST_FACTORIES) {
    // Skip duplicates
    const exists = await client.query('SELECT id FROM "Factory" WHERE name = $1 AND "organizationId" = $2', [f.name, org.id]);
    if (exists.rows.length > 0) {
      console.log(`  Skipping "${f.name}" (already exists)`);
      continue;
    }

    const id = cuid();
    const now = new Date();
    await client.query(
      `INSERT INTO "Factory" (id, name, location, address, "contactName", "contactEmail", "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, f.name, f.location, f.address, f.contactName, f.contactEmail, org.id, now, now]
    );
    console.log(`  Created "${f.name}" in ${f.location}`);
    created++;
  }

  console.log(`\nDone! Created ${created} new factories.`);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
