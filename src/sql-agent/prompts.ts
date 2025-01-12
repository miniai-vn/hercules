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
    input: 'Đếm tổng số mục trong bảng item.',
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
    input: 'Tìm mục đắt nhất trong bảng item.',
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
];
