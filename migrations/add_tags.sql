-- Create the Tag table (per-user tags for bookshelf organization)
CREATE TABLE "Tag" (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, -- This together with the UNIQUE contstraint is what
  -- makes the tags per-user. Otherwise we would have global tags which is not a fit for Florilegium at all
  name VARCHAR(50) NOT NULL, -- 50 characters feels reasonable. Limit it in order to keep the names concise and the UI snappy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Create the junction table for the many-to-many relationship
CREATE TABLE "Bookshelf_Item_Tag" (
  -- ON DELETE CASCADE on both foreign keys. If a user removes a book from their bookshelf, the tag 
  -- associations for that item cleans up automatically. If a tag is deleted, same thing.
  bookshelf_item_id VARCHAR(255) NOT NULL REFERENCES "Bookshelf_Item"(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES "Tag"(id) ON DELETE CASCADE,
  PRIMARY KEY (bookshelf_item_id, tag_id)
);

-- Index for fast lookups: "give me all tags for this bookshelf item"
CREATE INDEX idx_bookshelf_item_tag_item ON "Bookshelf_Item_Tag" (bookshelf_item_id);

-- Index for fast lookups: "give me all bookshelf items with this tag"
CREATE INDEX idx_bookshelf_item_tag_tag ON "Bookshelf_Item_Tag" (tag_id);