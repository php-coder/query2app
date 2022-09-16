CREATE TABLE categories (
  id bigserial NOT NULL,
  name varchar(50) NOT NULL,
  name_ru varchar(50) DEFAULT NULL,
  slug varchar(50) NOT NULL,
  created_at timestamp NOT NULL,
  created_by bigint NOT NULL,
  updated_at timestamp NOT NULL,
  updated_by bigint NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (name),
  UNIQUE (slug),
  UNIQUE (name_ru)
);
