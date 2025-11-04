<script setup lang="ts">
import { DateTime } from 'luxon'

interface CommentIF {
  comment: string
  submitterDisplayName: string
  timestamp: string
}

interface Props {
  businessId: string
  url?: string | null
  nudgeTop?: number
  nudgeLeft?: number
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  url: null,
  nudgeTop: 33,
  nudgeLeft: 20,
  maxLength: 4096
})

const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')
const showComments = ref(false)
const comments = ref<CommentIF[]>([])
const comment = ref<string>('')
const isSaving = ref(false)
const errorMessage = ref<string>('')

const charsRemaining = computed(() => {
  const length = comment.value ? comment.value.length : 0
  return props.maxLength - length
})

const numComments = computed(() => {
  const num = comments.value.length
  return num === 1 ? '1 Comment' : `${num} Comments`
})

const getUrl = computed(() => {
  return props.url || `businesses/${props.businessId}/comments`
})

/**
 * Formats API timestamp to Pacific timezone date/time string
 * @param timestamp - ISO timestamp string from API
 * @returns formatted date/time string in Pacific timezone
 */
function apiToPacificDateTime(timestamp: string): string {
  if (!timestamp)
  { return '' }

  try {
    const dateTime = DateTime.fromISO(timestamp, { zone: 'UTC' })
      .setZone('America/Vancouver')

    if (!dateTime.isValid)
    {
      return timestamp
    }

    return dateTime.toFormat('MMM dd, yyyy h:mm a')
  } catch (error) {
    console.error('Error formatting date:', error)
    return timestamp
  }
}

function validateComment(): void {
  errorMessage.value = ''

  if (!comment.value || comment.value.trim().length === 0) {
    errorMessage.value = 'Enter a comment.'
    return
  }

  if (comment.value.length > props.maxLength) {
    errorMessage.value = 'Maximum characters reached.'
    return
  }
}

async function fetchStaffComments(): Promise<void> {
  try {
    // TODO wtf is going on with this
    const response = await $fetch<any>(getUrl.value)
    const fetchedComments = (response?.comments) || []

    if (Array.isArray(fetchedComments) && fetchedComments[0] && typeof fetchedComments[0].comment === 'string') {
      comments.value = fetchedComments
    } else {
      comments.value = flattenAndSortComments(fetchedComments)
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
    comments.value = []
  }
}

async function save(): Promise<void> {
  validateComment()
  if (errorMessage.value) {
    return
  }

  if (isSaving.value)
  {
    return
  }
  isSaving.value = true

  const data = {
    comment: {
      businessId: props.businessId,
      comment: comment.value
    }
  }

  try {
    await $fetch(getUrl.value, {
      method: 'POST',
      body: data
    })

    comment.value = ''
    errorMessage.value = ''
    await fetchStaffComments()
  } catch (error) {
    console.error('save() error =', error)
    if (typeof window !== 'undefined') {
      alert('Could not save your comment. Please try again or cancel.')
    }
  } finally {
    isSaving.value = false
  }
}

function close(): void {
  errorMessage.value = ''
  showComments.value = false
}

/**
 * Flattens and sorts an array of comments.
 * @param comments - the array of comments to sort and deconstruct
 * @returns the sorted and flattened array of comments
 */
function flattenAndSortComments(commentsArray: Array<{ comment: CommentIF }>): Array<CommentIF> {
  if (commentsArray && commentsArray.length > 0) {
    // first use map to change comment.comment to comment
    const temp: Array<CommentIF> = commentsArray.map(c => c.comment)
    // then sort newest to oldest
    temp.sort((a, b) => new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1)
    return temp
  }
  return []
}

onMounted(async () => {
  await fetchStaffComments()
})
</script>

<template>
  <div
    id="staff-comments"
    class="inline-block"
  >
    <UPopover
      v-model:open="showComments"
      :popper="{ placement: 'bottom-start', offset: [nudgeLeft, nudgeTop] }"
    >
      <UButton
        id="comments-button"
        color="primary"
        variant="ghost"
        size="sm"
        icon="i-mdi-comment-text-outline"
      >
        {{ numComments }}
      </UButton>

      <template #content>
        <div
          id="staff-comment-container"
          class="bg-white rounded-lg shadow-lg p-6 w-[33rem] max-h-[36rem] flex flex-col"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-mdi-comment-text-outline"
                class="w-5 h-5 text-primary-600"
              />
              <span class="text-sm font-medium text-primary-600">{{ numComments }}</span>
            </div>
            <UButton
              id="close-button"
              color="primary"
              variant="ghost"
              icon="i-mdi-close"
              size="sm"
              @click="close()"
            />
          </div>

          <div class="mb-4">
            <UTextarea
              ref="textareaRef"
              v-model="comment"
              autofocus
              :rows="5"
              placeholder="Enter Comments"
              :error="errorMessage"
              @blur="validateComment"
            />
          </div>

          <div class="flex items-center justify-between mb-6">
            <div class="text-sm text-gray-600">
              {{ charsRemaining }} characters remaining
            </div>
            <div class="flex gap-2">
              <UButton
                id="save-button"
                color="primary"
                variant="solid"
                :loading="isSaving"
                @click="save()"
              >
                Save
              </UButton>
              <UButton
                id="cancel-button"
                color="neutral"
                variant="ghost"
                @click="close()"
              >
                Cancel
              </UButton>
            </div>
          </div>

          <div
            id="existing-comments"
            class="flex-1 overflow-y-auto pr-2"
          >
            <div
              v-for="(commentItem, i) in comments"
              :key="i"
              class="text-sm mb-4"
              :class="{ 'pt-4 border-t border-gray-300': i > 0 }"
            >
              <!-- TODO sanitize html -->
              <p
                class="whitespace-pre-line text-gray-700"
                v-html="commentItem.comment"
              />
              <p class="italic text-gray-600 mt-1">
                {{ commentItem.submitterDisplayName }}
                &hyphen;
                {{ apiToPacificDateTime(commentItem.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>

<style lang="scss" scoped>
#staff-comment-container {
  width: 33rem;
  max-height: 36rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#existing-comments {
  max-height: 16rem;
  overflow-y: auto;
  text-align: left;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
}
</style>
