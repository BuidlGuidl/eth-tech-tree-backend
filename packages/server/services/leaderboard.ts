import dbConnect from "../mongodb/dbConnect";
import User from "../mongodb/models/user";

/**
 * Get the leaderboard based on challenges completed, points score, and gas usage
 */
export const getLeaderboard = async (): Promise<any[]> => {
    await dbConnect();
    // Get the users who have the most points, exclude the ones who have no points
    const users = await User.find({ points: { $gt: 0 } }, "-_id -__v").sort({ points: -1, totalGasUsed: 1 });

    const leaderboard = users.map((user, index) => {
        const challengesCompleted = user.challenges.filter(challenge => challenge.status === "success").length;

        return {
            address: user.address,
            ens: user.ens,
            challengesCompleted,
            points: user.points as number,
            totalGasUsed: user.totalGasUsed as number,
            rank: index + 1
        };
    });

    return leaderboard;
};
