# G2.1 — ERD (Mermaid)

Logical/entity relationship diagram for the ANT JEWELRY data model.

```mermaid
erDiagram
    USER {
        String id PK
        String email UK
        String name "nullable"
        String passwordHash
        Role role "ADMIN | EDITOR"
        Boolean locked
        DateTime createdAt
        DateTime updatedAt
    }

    CATEGORY {
        String id PK
        String name
        String slug UK
        String type
        Int sortOrder
        CategoryStatus status "VISIBLE | HIDDEN"
        DateTime createdAt
        DateTime updatedAt
    }

    PRODUCT {
        String id PK
        String categoryId FK
        String name
        String slug UK
        String brand
        String type
        String description
        Json details "nullable"
        Int price "VND integer"
        ProductStatus status "VISIBLE | HIDDEN"
        DateTime createdAt
        DateTime updatedAt
    }

    PRODUCT_COLOR {
        String id PK
        String productId FK
        String name
        String hex
        DateTime createdAt
        DateTime updatedAt
    }

    PRODUCT_IMAGE {
        String id PK
        String productId FK
        String productColorId FK "nullable, shared image when null"
        String storageKey UK "nullable, local storage key/path"
        String url
        String alt
        Boolean isFront
        Boolean isHover
        Int sortOrder
        DateTime createdAt
        DateTime updatedAt
    }

    PENDING_IMAGE_DELETION {
        String id PK
        String storageKey UK
        DateTime createdAt
    }

    BLOG_POST {
        String id PK
        String title
        String slug UK
        String summary
        String body
        String coverImageUrl
        DateTime publishedAt
        BlogPostStatus status "DRAFT | PUBLISHED"
        DateTime createdAt
        DateTime updatedAt
    }

    BLOG_IMAGE {
        String id PK
        String blogPostId FK
        String url
        String alt
        Int sortOrder
        DateTime createdAt
        DateTime updatedAt
    }

    HERO_SLIDE {
        String id PK
        String imageUrl
        String alt
        String title
        String subtitle
        String linkUrl
        Int sortOrder
        HeroSlideStatus status "VISIBLE | HIDDEN"
        DateTime createdAt
        DateTime updatedAt
    }

    SETTING {
        String id PK
        String siteName
        String phone
        String facebookUrl
        String instagramUrl
        String address
        String email
        DateTime createdAt
        DateTime updatedAt
    }

    CATEGORY ||--o{ PRODUCT : "has (onDelete: Restrict)"
    PRODUCT ||--o{ PRODUCT_COLOR : "has (onDelete: Cascade)"
    PRODUCT ||--o{ PRODUCT_IMAGE : "has shared or all images (onDelete: Cascade)"
    PRODUCT_COLOR o|--o{ PRODUCT_IMAGE : "has color-specific images (onDelete: Cascade)"
    BLOG_POST ||--o{ BLOG_IMAGE : "has (onDelete: Cascade)"
```

## Notes

- **Price:** `PRODUCT.price` is stored as an integer (`Int`) in VND.
- **Unique slugs:** `CATEGORY.slug`, `PRODUCT.slug`, and `BLOG_POST.slug` are unique.
- **Product images:** `PRODUCT_IMAGE` always belongs to a `PRODUCT` (`productId`) and may optionally belong to a `PRODUCT_COLOR` (`productColorId`).
  - `productColorId = null`: shared/common image for the product.
  - `productColorId != null`: image attached to a specific color.
  - `sortOrder` defines image order; `isFront` marks the front/primary image and `isHover` marks the image shown on card hover.
  - `storageKey` is nullable and unique; for uploaded images it stores the local storage key (served from `/uploads/<storageKey>`). Seed/demo images may use an external `url` without a storage key.
- **Pending image deletions:** `PENDING_IMAGE_DELETION` queues local image storage keys whose database rows were removed, so file cleanup can retry until the file is deleted. It has no relation to `PRODUCT_IMAGE`; `storageKey` matches the removed image key.
- **Delete behavior:**
  - Deleting a `PRODUCT` cascades to its `PRODUCT_COLOR` and `PRODUCT_IMAGE` records.
  - Deleting a `PRODUCT_COLOR` cascades to its color-specific `PRODUCT_IMAGE` records.
  - A `CATEGORY` cannot be deleted while related `PRODUCT` records exist (`onDelete: Restrict` on `PRODUCT.categoryId`).
- **Blog images:** `BLOG_POST` can have multiple images via `BLOG_IMAGE` records (ordered by `sortOrder`, deleted when the blog post is deleted). `coverImageUrl` remains on `BLOG_POST` for the cover/primary image reference.
- **Roles:** `USER.role` is `ADMIN` or `EDITOR`; `USER.locked` disables sign-in and invalidates an existing session on its next request.
- **Schema file:** Prisma schema is defined in `prisma/schema.prisma`. Production PostgreSQL mirrors it in `prisma/postgresql/schema.prisma`.
