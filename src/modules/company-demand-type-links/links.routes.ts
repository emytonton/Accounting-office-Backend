import { Router } from 'express';
import {
  catalog,
  listLinks,
  createLink,
  updateLink,
  removeLink,
} from './links.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  companyIdParamSchema,
  createLinkSchema,
  updateLinkSchema,
  linkIdParamSchema,
} from './links.schema';

/// Estas rotas são montadas sob /companies/:companyId/demand-type-links
export const linksRoutes = Router({ mergeParams: true });

linksRoutes.get(
  '/catalog',
  authenticate,
  validate(companyIdParamSchema),
  catalog,
);

linksRoutes.get(
  '/',
  authenticate,
  validate(companyIdParamSchema),
  listLinks,
);

linksRoutes.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createLinkSchema),
  createLink,
);

linksRoutes.patch(
  '/:linkId',
  authenticate,
  authorize('admin'),
  validate(updateLinkSchema),
  updateLink,
);

linksRoutes.delete(
  '/:linkId',
  authenticate,
  authorize('admin'),
  validate(linkIdParamSchema),
  removeLink,
);
