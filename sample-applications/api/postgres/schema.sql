-- Exported from QuickDBD: https://www.quickdatatabasediagrams.com/
-- Link to schema: https://app.quickdatabasediagrams.com/#/schema/lPacGjy-I02IEJUG4zpDkA
-- NOTE! If you have used non-SQL datatypes in your design, you will have to change these here.

-- Modify the code to update the DB schema diagram.
-- To reset the sample schema, replace everything with
-- two dots ('..' - without quotes).

CREATE TABLE "users" (
    "userid" int  NOT NULL ,
    "name" varchar(200)  NOT NULL ,
    "email" varchar(200)  NOT NULL ,
    CONSTRAINT "pk_User" PRIMARY KEY (
        "userid"
    )
);

CREATE TABLE "orders" (
    "orderid" serial ,
    "userid" int  NOT NULL ,
    "total" numeric  NOT NULL,
    CONSTRAINT "pk_Order" PRIMARY KEY (
        "orderid"
    )
);

CREATE TABLE "cart_entry" (
    "userid" int  NOT NULL ,
    "productid" int  NOT NULL ,
    "amount" int  NOT NULL CHECK (amount >= 0),
    CONSTRAINT "pk_CartEntry" PRIMARY KEY (
        "userid",
        "productid"
    )
);

CREATE TABLE "order_entry" (
    "orderid" int  NOT NULL ,
    "productid" int  NOT NULL ,
    "amount" int  NOT NULL CHECK (amount >= 0),
    "price" numeric  NOT NULL ,
    CONSTRAINT "pk_OrderEntry" PRIMARY KEY (
        "orderid",
        "productid"
    )
);

CREATE TABLE "products" (
    "productid" int  NOT NULL ,
    "name" varchar(200)  NOT NULL ,
    "amount" int  NOT NULL CHECK (amount >= 0),
    "price" numeric  NOT NULL ,
    CONSTRAINT "pk_Product" PRIMARY KEY (
        "productid"
    )
);

CREATE TABLE "warehouse" (
    "stock" int  NOT NULL ,
    "sales" numeric  NOT NULL
);

ALTER TABLE "cart_entry" ADD CONSTRAINT "fk_Cart_Entry_userid" FOREIGN KEY("userid")
REFERENCES "users" ("userid");

ALTER TABLE "cart_entry" ADD CONSTRAINT "fk_Cart_Entry_productid" FOREIGN KEY("productid")
REFERENCES "products" ("productid");

ALTER TABLE "order_entry" ADD CONSTRAINT "fk_Order_Entry_orderid" FOREIGN KEY("orderid")
REFERENCES "orders" ("orderid");

ALTER TABLE "order_entry" ADD CONSTRAINT "fk_Order_Entry_productid" FOREIGN KEY("productid")
REFERENCES "products" ("productid");

INSERT INTO warehouse (stock, sales) VALUES (0, 0);
