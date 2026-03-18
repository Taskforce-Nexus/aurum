-- ============================================================
-- Reason — Framework Engine Migration
-- Migration 007: reemplaza Document Specification Library estática
-- Fecha: 2026-03-17
-- ============================================================

-- 1. Eliminar tabla document_specs (reemplazada por Framework Engine)
--    CASCADE elimina también la FK en project_documents.spec_id
DROP TABLE IF EXISTS public.document_specs CASCADE;

-- 2. Eliminar columna spec_id en project_documents (ya eliminada por CASCADE)
--    Intentar DROP por si acaso el CASCADE no la eliminó
ALTER TABLE public.project_documents DROP COLUMN IF EXISTS spec_id;

-- 3. Agregar composition (JSON dinámico del Framework Engine)
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS composition jsonb;

-- 4. Agregar deliverable_index para ordenar entregables en la sesión
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS deliverable_index integer;

-- 5. Agregar key_question para mostrar en UI (la pregunta que responde el entregable)
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS key_question text;

-- ============================================================
-- NOTA PARA JUAN:
-- Ejecutar este archivo completo en Supabase SQL Editor.
-- El DROP TABLE document_specs CASCADE es irreversible.
-- Asegurarse de que no hay datos en document_specs que necesiten preservarse.
-- ============================================================
