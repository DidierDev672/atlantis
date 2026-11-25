import { createContext } from 'react';
import { FALLBACK_CONSERVATIVE_POLICY } from '../../domain/resource-policy/policy';
import type { ResourcePolicy } from '../../domain/resource-policy/types';

export const ResourcePolicyContext = createContext<ResourcePolicy>(
  FALLBACK_CONSERVATIVE_POLICY
);
