/**
 * Calculates a Trust Score for a user based on their profile completeness and verification status.
 * 
 * Logic:
 * - Mobile Verified: +10 pts
 * - Email Verified: +10 pts
 * - KYC Identity Verified: +50 pts (isKycVerified in Profile or isIdentityVerified in User)
 * - Social Links Added: +15 pts (if socialLinks is not empty)
 * - Photo Count > 2: +10 pts (needs Photo model check, or passed count)
 * - Bio length > 100 chars: +5 pts
 * 
 * Total: 100 pts
 */
const calculateTrustScore = (user, profile, photoCount = 0) => {
  let score = 0;

  if (user.isMobileVerified) score += 10;
  if (user.isEmailVerified) score += 10;
  
  if (profile.isKycVerified || user.isIdentityVerified) score += 50;

  if (profile.socialLinks && Object.keys(profile.socialLinks).length > 0) {
    score += 15;
  }

  if (photoCount >= 2) score += 10;

  if (profile.bio && profile.bio.length >= 100) {
    score += 5;
  }

  return Math.min(score, 100);
};

module.exports = {
  calculateTrustScore,
};
