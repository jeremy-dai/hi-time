// Script to delete all quarterly plans from database and localStorage
// Run this in the browser console while on http://localhost:5173

async function clearAllPlans() {
  console.log('🗑️  Starting to clear all plans...')

  // Import API functions
  const { listPlans, deletePlan } = await import('../time-tracker/src/api.ts')

  try {
    // 1. List all plans
    console.log('📋 Fetching all plans...')
    const plans = await listPlans()
    console.log(`Found ${plans.length} plan(s):`, plans)

    if (plans.length === 0) {
      console.log('✅ No plans to delete')
    } else {
      // 2. Delete each plan
      for (const plan of plans) {
        console.log(`🗑️  Deleting plan: ${plan.name} (${plan.planId})`)
        const success = await deletePlan(plan.planId)
        if (success) {
          console.log(`✅ Deleted: ${plan.name}`)
        } else {
          console.log(`❌ Failed to delete: ${plan.name}`)
        }
      }
    }

    // 3. Clear localStorage
    console.log('🧹 Clearing localStorage...')
    localStorage.removeItem('quarterly-plan-data')
    console.log('✅ localStorage cleared')

    console.log('✨ All done! Refresh the page to start fresh.')
    console.log('You can now import your new V5 format plan.')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the function
clearAllPlans()
