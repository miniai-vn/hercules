export const itemPrompts = [
  {
    input: 'Liệt kê tất cả các mục trong bảng item.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4';`,
  },
  {
    input: 'Tìm một mục có tên là "Laptop".',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND name = 'Laptop';`,
  },
  {
    input: 'Liệt kê các mục có giá lớn hơn 500.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND price > 500;`,
  },
  {
    input: 'Tìm mục có mô tả chứa từ "premium".',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND description ILIKE '%premium%';`,
  },
  {
    input: 'Tìm mục được thêm vào trong tháng 12 năm 2024.',
    query: `
      SELECT * 
      FROM "public"."Item" 
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4'
        AND EXTRACT(YEAR FROM created_at) = 2024 
        AND EXTRACT(MONTH FROM created_at) = 12;
    `,
  },
  {
    input: 'Tổng số mục trong bảng item.',
    query: `SELECT COUNT(*) FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4';`,
  },
  {
    input: 'Liệt kê các mục có giá trong khoảng từ 100 đến 1000.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND price BETWEEN 100 AND 1000;`,
  },
  {
    input: 'Sắp xếp các mục theo giá giảm dần và lấy 5 mục đầu tiên.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' ORDER BY price DESC LIMIT 5;`,
  },
  {
    input: 'Tìm sản phẩm nhất trong bảng item.',
    query: `
      SELECT * 
      FROM "public"."Item" 
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4'
        AND price = (SELECT MAX(price) FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4');
    `,
  },
  {
    input: 'Tìm các mục có tên bắt đầu bằng chữ "A".',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND name ILIKE 'A%';`,
  },
  {
    input: 'Baby three có giá bao nhiêu.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND name like '%Baby three%';`,
  },
  {
    input: 'Tìm tất cả các mục có tên chứa từ "Special".',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND name ILIKE '%Special%';`,
  },
  {
    input: 'Liệt kê các mục có giá nhỏ hơn 300.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND price < 300;`,
  },
  {
    input: 'Tìm các mục được thêm vào trong năm 2023.',
    query: `
      SELECT * 
      FROM "public"."Item" 
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4'
        AND EXTRACT(YEAR FROM created_at) = 2023;
    `,
  },
  {
    input: 'Liệt kê các mục có mô tả chứa từ "eco-friendly".',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND description ILIKE '%eco-friendly%';`,
  },
  {
    input: 'Liệt kê tất cả các mục được thêm vào ngày 1 tháng 1 năm 2024.',
    query: `
      SELECT * 
      FROM "public"."Item" 
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4'
        AND DATE(created_at) = '2024-01-01';
    `,
  },
  {
    input: 'Tìm các mục không có mô tả.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND description IS NULL;`,
  },
  {
    input: 'Đếm số mục có giá từ 500 đến 1000.',
    query: `SELECT COUNT(*) FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND price BETWEEN 500 AND 1000;`,
  },
  {
    input: 'Liệt kê các mục có giá bằng 0.',
    query: `SELECT * FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND price = 0;`,
  },
  {
    input: 'Tìm mục có giá cao thứ hai.',
    query: `
      SELECT * 
      FROM "public"."Item" 
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4'
        AND price = (
          SELECT DISTINCT price 
          FROM "public"."Item" 
          WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' 
          ORDER BY price DESC 
          OFFSET 1 LIMIT 1
        );
    `,
  },
  {
    input: 'Cập nhật giá của tất cả các mục giảm 10%.',
    query: `
      UPDATE "public"."Item"
      SET price = price * 0.9
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4';
    `,
  },
  {
    input: 'Xóa các mục có giá lớn hơn 5000.',
    query: `DELETE FROM "public"."Item" WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' AND price > 5000;`,
  },
  {
    input: 'Liệt kê các mục có cả tên và mô tả rỗng.',
    query: `
      SELECT * 
      FROM "public"."Item" 
      WHERE "shopId" = '9db28823-60d2-420c-bc10-e8a4ce9f51f4' 
        AND (name IS NULL OR name = '')
        AND (description IS NULL OR description = '');
    `,
  },
];
