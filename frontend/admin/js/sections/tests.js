// Simple Test Management that works
console.log('🧪 Loading Test Management...');

function initTestManagement() {
    console.log('🚀 Initializing Test Management...');
    
    // Wait a moment for DOM to be ready
    setTimeout(() => {
        const form = document.getElementById('bulk-creation-form');
        const button = document.getElementById('create-test-btn');
        
        if (form && button) {
            console.log('✅ Found form and button');
            
            // Remove existing listeners
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add event listener
            const finalForm = document.getElementById('bulk-creation-form');
            finalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('📝 Form submitted!');
                
                const quantity = parseInt(document.getElementById('test-quantity').value);
                const createdBy = document.getElementById('batch-creator').value || 'Admin';
                const notes = document.getElementById('batch-notes').value || '';
                
                if (quantity < 1 || quantity > 1000) {
                    alert('Quantity must be between 1 and 1000');
                    return;
                }
                
                // Show loading
                button.disabled = true;
                button.textContent = '⏳ Creating...';
                
                try {
                    const response = await fetch('/api/admin/create-test-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantity, notes, createdBy })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const totalCreated = result.data.quantity;
                        const samplesShown = result.data.sample_test_ids.length;
                        
                        let message = `✅ SUCCESS! Created ${totalCreated} tests\n\nBatch ID: ${result.data.batch_id}\n\n`;
                        
                        if (totalCreated <= 5) {
                            message += `All Test IDs:\n${result.data.sample_test_ids.join('\n')}`;
                        } else {
                            message += `Sample Test IDs (showing first ${samplesShown} of ${totalCreated} total):\n`;
                            message += `${result.data.sample_test_ids.join('\n')}\n\n`;
                            message += `✨ ${totalCreated - samplesShown} additional tests were also created in this batch\n\n`;
                            message += `All ${totalCreated} tests are ready for shipping and use!`;
                        }
                        
                        alert(message);
                        finalForm.reset();
                        document.getElementById('test-quantity').value = 10;
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (error) {
                    alert('Network error: ' + error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = '📦 Create Tests';
                }
            });
            
            // Start test ID preview
            function updatePreview() {
                const preview = document.getElementById('test-id-preview');
                if (preview) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const randomId = Math.floor(Math.random() * 1000) + 100;
                    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
                    preview.textContent = `${year}-${month}-${randomId}-${randomSuffix}`;
                }
            }
            updatePreview();
            setInterval(updatePreview, 3000);
            
            console.log('✅ Test Management ready!');
        } else {
            console.error('❌ Form or button not found');
        }
    }, 500);
}

window.initTestManagement = initTestManagement;
