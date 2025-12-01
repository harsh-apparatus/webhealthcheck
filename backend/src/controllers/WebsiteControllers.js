import { z } from 'zod';
import prisma from '../config/database.js';

const addWebsiteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  url: z.string().min(1, 'URL is required').refine(
    (val) => {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      return urlPattern.test(val) || z.string().url().safeParse(val).success;
    },
    { message: 'Invalid URL format' }
  ),
  protocol: z.enum(['http', 'https'], {
    errorMap: () => ({ message: 'Protocol must be either http or https' }),
  }),
});

export const addWebsite = async (req, res) => {
  try {
    const validationResult = addWebsiteSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const { name, url, protocol } = validationResult.data;

    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    let fullUrl = url.trim();
    const urlHasProtocol = /^https?:\/\//i.test(fullUrl);
    
    if (urlHasProtocol) {
      const existingProtocol = fullUrl.match(/^https?:\/\//i)[0].replace('://', '').toLowerCase();
      if (existingProtocol !== protocol) {
        return res.status(400).json({
          success: false,
          message: `URL protocol mismatch. URL contains ${existingProtocol} but ${protocol} was specified.`,
        });
      }
    } else {
      fullUrl = `${protocol}://${fullUrl}`;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const website = await prisma.website.create({
      data: {
        userId,
        name,
        url: fullUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Website added successfully',
      data: {
        id: website.id,
        name: website.name,
        url: website.url,
        monitoringStatus: website.monitoringStatus,
        checkInterval: website.checkInterval,
        createdAt: website.createdAt,
      },
    });
  } catch (error) {
    console.error('Error adding website:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Website with this URL already exists for this user',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

