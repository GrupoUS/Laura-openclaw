-- Create ontology_entities table
CREATE TABLE IF NOT EXISTS ontology_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by type
CREATE INDEX IF NOT EXISTS ix_ontology_entities_type ON ontology_entities (type);
-- GIN index for querying properties
CREATE INDEX IF NOT EXISTS ix_ontology_entities_properties ON ontology_entities USING gin (properties);

-- Create ontology_relations table
CREATE TABLE IF NOT EXISTS ontology_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_id UUID NOT NULL REFERENCES ontology_entities(id) ON DELETE CASCADE,
    relation_type VARCHAR NOT NULL,
    to_id UUID NOT NULL REFERENCES ontology_entities(id) ON DELETE CASCADE,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for relation queries
CREATE INDEX IF NOT EXISTS ix_ontology_relations_from ON ontology_relations (from_id);
CREATE INDEX IF NOT EXISTS ix_ontology_relations_type ON ontology_relations (relation_type);
CREATE INDEX IF NOT EXISTS ix_ontology_relations_to ON ontology_relations (to_id);

-- GIN index for querying properties
CREATE INDEX IF NOT EXISTS ix_ontology_relations_properties ON ontology_relations USING gin (properties);

-- Unique constraint on from_id + relation_type + to_id
CREATE UNIQUE INDEX IF NOT EXISTS ix_ontology_relations_from_type_to ON ontology_relations (from_id, relation_type, to_id);
