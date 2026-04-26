-- Add CANCELLED status for invitation lifecycle management.
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
