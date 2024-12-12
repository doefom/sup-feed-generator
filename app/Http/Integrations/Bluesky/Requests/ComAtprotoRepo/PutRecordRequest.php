<?php

namespace App\Http\Integrations\Bluesky\Requests\ComAtprotoRepo;

use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

class PutRecordRequest extends Request implements HasBody
{
    use HasJsonBody;

    /**
     * The HTTP method of the request
     */
    protected Method $method = Method::POST;

    public function __construct(
        protected readonly string $repo,
        protected readonly string $collection,
        protected readonly string $rkey,
        protected readonly ?bool $validate,
        protected readonly array $record,
        protected readonly ?string $swapRecord = null,
        protected readonly ?string $swapCommit = null,
    )
    {
    }

    /**
     * The endpoint for the request
     */
    public function resolveEndpoint(): string
    {
        return '/xrpc/com.atproto.repo.putRecord';
    }

    protected function defaultBody(): array
    {
        $payload = [
            'repo' => $this->repo,
            'collection' => $this->collection,
            'rkey' => $this->rkey,
            'record' => $this->record,
        ];

        if ($this->validate) {
            $payload['validate'] = $this->validate;
        }

        if ($this->swapRecord) {
            $payload['swapRecord'] = $this->swapRecord;
        }

        if ($this->swapCommit) {
            $payload['swapCommit'] = $this->swapCommit;
        }

        return $payload;
    }
}